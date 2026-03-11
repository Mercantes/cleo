import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get last 3 months of transactions with categories
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const startDate = threeMonthsAgo.toISOString().split('T')[0];

  const { data: transactions } = await supabase
    .from('transactions')
    .select('date, amount, type, categories(name)')
    .eq('user_id', user.id)
    .eq('type', 'debit')
    .gte('date', startDate)
    .order('date', { ascending: true });

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({ predictions: [], hasEnoughData: false });
  }

  // Group by category and month
  const categoryMonthly = new Map<string, Map<string, number>>();

  for (const tx of transactions) {
    const catObj = tx.categories as unknown as { name: string } | null;
    const category = catObj?.name || 'Outros';
    const month = tx.date.slice(0, 7);

    if (!categoryMonthly.has(category)) {
      categoryMonthly.set(category, new Map());
    }
    const monthMap = categoryMonthly.get(category)!;
    monthMap.set(month, (monthMap.get(month) || 0) + Math.abs(Number(tx.amount)));
  }

  // Calculate predictions per category
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  const predictions = [];

  for (const [category, monthMap] of categoryMonthly) {
    const months = [...monthMap.entries()].sort(([a], [b]) => a.localeCompare(b));

    // Calculate average from previous months (exclude current)
    const previousMonths = months.filter(([m]) => m < currentMonth);
    if (previousMonths.length === 0) continue;

    const avgSpending = previousMonths.reduce((s, [, v]) => s + v, 0) / previousMonths.length;

    // Current month spending so far
    const currentSpending = monthMap.get(currentMonth) || 0;

    // Projected end-of-month spending (linear extrapolation)
    const projectedSpending = monthProgress > 0.1
      ? Math.round(currentSpending / monthProgress)
      : avgSpending;

    // Trend: compare last month vs average
    const lastMonth = previousMonths[previousMonths.length - 1];
    const trend = lastMonth ? ((lastMonth[1] - avgSpending) / avgSpending) * 100 : 0;

    predictions.push({
      category,
      avgMonthly: Math.round(avgSpending),
      currentSpending: Math.round(currentSpending),
      projectedSpending: Math.round(projectedSpending),
      trend: Math.round(trend),
      status: projectedSpending > avgSpending * 1.15 ? 'over' :
              projectedSpending < avgSpending * 0.85 ? 'under' : 'on_track',
    });
  }

  // Sort by projected spending descending
  predictions.sort((a, b) => b.projectedSpending - a.projectedSpending);

  return NextResponse.json({
    predictions: predictions.slice(0, 8),
    hasEnoughData: true,
    monthProgress: Math.round(monthProgress * 100),
  });
}
