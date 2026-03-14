import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (request: NextRequest, { supabase, user }) => {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // Previous month for comparison
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

  const [currentRes, prevRes] = await Promise.all([
    supabase.from('transactions')
      .select('amount, type, date, categories(name, icon)')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true }),
    supabase.from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('date', prevStart)
      .lte('date', prevEnd),
  ]);

  const transactions = currentRes.data || [];
  const prevTransactions = prevRes.data || [];

  const income = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const prevIncome = prevTransactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
  const prevExpenses = prevTransactions.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);

  const categoryMap = new Map<string, { name: string; icon: string; total: number; count: number }>();
  for (const tx of transactions.filter(t => t.type === 'debit')) {
    const cat = (tx.categories as unknown as { name: string; icon: string } | null);
    const name = cat?.name || 'Outros';
    const icon = cat?.icon || '📦';
    const existing = categoryMap.get(name) || { name, icon, total: 0, count: 0 };
    existing.total += Number(tx.amount);
    existing.count += 1;
    categoryMap.set(name, existing);
  }

  const categories = Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
    .map(c => ({
      ...c,
      percentage: expenses > 0 ? Math.round((c.total / expenses) * 100) : 0,
    }));

  const dailyMap = new Map<string, number>();
  for (const tx of transactions.filter(t => t.type === 'debit')) {
    const day = tx.date;
    dailyMap.set(day, (dailyMap.get(day) || 0) + Number(tx.amount));
  }
  const dailySpending = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  const topExpenses = transactions
    .filter(t => t.type === 'debit')
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5)
    .map(t => ({
      amount: Number(t.amount),
      date: t.date,
      category: (t.categories as unknown as { name: string } | null)?.name || 'Outros',
    }));

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return NextResponse.json({
    report: {
      period: { year, month, label: `${monthNames[month - 1]} ${year}` },
      summary: { income, expenses, balance, savingsRate, transactionCount: transactions.length },
      comparison: {
        prevIncome,
        prevExpenses,
        incomeChange: prevIncome > 0 ? Math.round(((income - prevIncome) / prevIncome) * 100) : 0,
        expenseChange: prevExpenses > 0 ? Math.round(((expenses - prevExpenses) / prevExpenses) * 100) : 0,
      },
      categories,
      dailySpending,
      topExpenses,
    },
  }, {
    headers: { 'Cache-Control': 'private, max-age=600, stale-while-revalidate=120' },
  });
});
