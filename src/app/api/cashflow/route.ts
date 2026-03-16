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
    .select('amount, type, date')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('[cashflow] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const txs = data || [];

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

  let runningBalance = 0;
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

  return NextResponse.json({
    month: monthParam,
    totalIncome,
    totalExpenses,
    totalNet,
    bestDay,
    worstDay,
    days,
  }, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  });
});
