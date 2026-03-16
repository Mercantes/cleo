import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (request: NextRequest, { supabase, user }) => {
  const searchParams = request.nextUrl.searchParams;
  const now = new Date();
  const monthParam = searchParams.get('month') || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [year, month] = monthParam.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, date, description, merchant, category_id, categories(name, icon)')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('[cashflow] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const txs = data || [];

  // Get current total balance across all user accounts
  const { data: accountsData } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', user.id);

  const currentTotalBalance = (accountsData || []).reduce(
    (sum, acc) => sum + Number(acc.balance || 0),
    0
  );

  // Calculate this month's net change to derive starting balance
  let monthNet = 0;
  for (const tx of txs) {
    const amount = Number(tx.amount);
    monthNet += tx.type === 'credit' ? amount : -amount;
  }
  const startingBalance = currentTotalBalance - monthNet;

  // Aggregate by day
  const dailyMap = new Map<string, { income: number; expenses: number }>();

  // Pre-fill all days of the month
  for (let d = 1; d <= lastDay; d++) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dailyMap.set(key, { income: 0, expenses: 0 });
  }

  for (const tx of txs) {
    const day = dailyMap.get(tx.date);
    if (day) {
      const amount = Number(tx.amount);
      if (tx.type === 'credit') day.income += amount;
      else day.expenses += amount;
    }
  }

  let runningBalance = startingBalance;
  const days = Array.from(dailyMap.entries()).map(([date, { income, expenses }]) => {
    const net = income - expenses;
    runningBalance += net;
    return {
      date,
      day: Number(date.split('-')[2]),
      income,
      expenses,
      net,
      balance: runningBalance,
    };
  });

  const totalIncome = days.reduce((s, d) => s + d.income, 0);
  const totalExpenses = days.reduce((s, d) => s + d.expenses, 0);
  const totalNet = totalIncome - totalExpenses;

  // Find best and worst days
  const daysWithActivity = days.filter((d) => d.income > 0 || d.expenses > 0);
  const bestDay = daysWithActivity.length > 0
    ? daysWithActivity.reduce((best, d) => d.net > best.net ? d : best)
    : null;
  const worstDay = daysWithActivity.length > 0
    ? daysWithActivity.reduce((worst, d) => d.net < worst.net ? d : worst)
    : null;

  // Aggregate expenses by category
  const categoryMap = new Map<string, { name: string; icon: string; total: number }>();
  for (const tx of txs) {
    if (tx.type !== 'debit') continue;
    const catRaw = tx.categories as unknown;
    const cat = Array.isArray(catRaw) ? (catRaw[0] as { name: string; icon: string } | undefined) ?? null : catRaw as { name: string; icon: string } | null;
    const key = cat ? cat.name : 'Sem categoria';
    const icon = cat ? cat.icon : '📦';
    const existing = categoryMap.get(key);
    if (existing) {
      existing.total += Number(tx.amount);
    } else {
      categoryMap.set(key, { name: key, icon, total: Number(tx.amount) });
    }
  }
  const categoryBreakdown = Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Top 5 biggest expenses
  const topExpenses = txs
    .filter((tx) => tx.type === 'debit')
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5)
    .map((tx) => ({
      description: (tx.merchant as string) || tx.description,
      amount: Number(tx.amount),
      date: tx.date,
      category: (() => { const r = tx.categories as unknown; return Array.isArray(r) ? (r[0] as { name: string; icon: string } | undefined) ?? null : r as { name: string; icon: string } | null; })(),
    }));

  return NextResponse.json({
    month: monthParam,
    totalIncome,
    totalExpenses,
    totalNet,
    bestDay,
    worstDay,
    days,
    categoryBreakdown,
    topExpenses,
  }, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  });
});
