import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (request: NextRequest, { supabase, user }) => {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month1 = parseInt(searchParams.get('month1') || String(now.getMonth() + 1));
  const year1 = parseInt(searchParams.get('year1') || String(now.getFullYear()));
  const month2 = parseInt(searchParams.get('month2') || String(now.getMonth()));
  const year2 = parseInt(searchParams.get('year2') || String(month2 === 0 ? now.getFullYear() - 1 : now.getFullYear()));

  const actualMonth2 = month2 === 0 ? 12 : month2;
  const actualYear2 = month2 === 0 ? year2 : year2;

  async function getMonthData(y: number, m: number) {
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const end = new Date(y, m, 0).toISOString().split('T')[0];

    const { data } = await supabase.from('transactions')
      .select('amount, type, categories(name, icon)')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end);

    const txs = data || [];
    const income = txs.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = txs.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);

    const categoryMap = new Map<string, { name: string; icon: string; total: number }>();
    for (const tx of txs.filter(t => t.type === 'debit')) {
      const cat = (tx.categories as unknown as { name: string; icon: string } | null);
      const name = cat?.name || 'Outros';
      const icon = cat?.icon || '📦';
      const existing = categoryMap.get(name) || { name, icon, total: 0 };
      existing.total += Number(tx.amount);
      categoryMap.set(name, existing);
    }

    return {
      year: y,
      month: m,
      income,
      expenses,
      balance: income - expenses,
      savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
      transactionCount: txs.length,
      categories: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
    };
  }

  const [data1, data2] = await Promise.all([
    getMonthData(year1, month1),
    getMonthData(actualYear2, actualMonth2),
  ]);

  const allCats = new Set([
    ...data1.categories.map(c => c.name),
    ...data2.categories.map(c => c.name),
  ]);

  const categoryComparison = Array.from(allCats).map(name => {
    const c1 = data1.categories.find(c => c.name === name);
    const c2 = data2.categories.find(c => c.name === name);
    const amount1 = c1?.total || 0;
    const amount2 = c2?.total || 0;
    return {
      name,
      icon: c1?.icon || c2?.icon || '📦',
      amount1,
      amount2,
      diff: amount1 - amount2,
      changePercent: amount2 > 0 ? Math.round(((amount1 - amount2) / amount2) * 100) : (amount1 > 0 ? 100 : 0),
    };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return NextResponse.json({
    comparison: {
      month1: { ...data1, label: `${monthNames[data1.month - 1]} ${data1.year}` },
      month2: { ...data2, label: `${monthNames[data2.month - 1]} ${data2.year}` },
      categoryComparison,
      highlights: {
        incomeChange: data2.income > 0 ? Math.round(((data1.income - data2.income) / data2.income) * 100) : 0,
        expenseChange: data2.expenses > 0 ? Math.round(((data1.expenses - data2.expenses) / data2.expenses) * 100) : 0,
        balanceChange: data1.balance - data2.balance,
      },
    },
  }, {
    headers: { 'Cache-Control': 'private, max-age=600, stale-while-revalidate=120' },
  });
});
