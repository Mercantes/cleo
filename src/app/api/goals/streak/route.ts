import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { createAdminClient } from '@/lib/supabase/admin';

interface MonthResult {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  metGoal: boolean;
}

export const GET = withAuth(async (_request, { user }) => {
  const db = createAdminClient();

  // Get user goals
  const { data: goals } = await db
    .from('goals')
    .select('monthly_savings_target, streak_months, best_streak')
    .eq('user_id', user.id)
    .single();

  const target = goals?.monthly_savings_target ? Number(goals.monthly_savings_target) : 0;

  if (target <= 0) {
    return NextResponse.json({
      months: [],
      currentStreak: 0,
      bestStreak: 0,
      target: 0,
    });
  }

  // Get last 12 months of transaction data in a single query
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const rangeStart = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: allTransactions } = await db
    .from('transactions')
    .select('date, amount, type')
    .eq('user_id', user.id)
    .gte('date', rangeStart)
    .lte('date', rangeEnd);

  const txs = allTransactions || [];

  // Group transactions by month
  const monthBuckets = new Map<string, { income: number; expenses: number; count: number }>();
  for (const t of txs) {
    const monthKey = (t.date as string).substring(0, 7); // "YYYY-MM"
    const bucket = monthBuckets.get(monthKey) || { income: 0, expenses: 0, count: 0 };
    if (t.type === 'credit') {
      bucket.income += Number(t.amount);
    } else {
      bucket.expenses += Number(t.amount);
    }
    bucket.count++;
    monthBuckets.set(monthKey, bucket);
  }

  const months: MonthResult[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const bucket = monthBuckets.get(monthKey) || { income: 0, expenses: 0, count: 0 };
    const savings = Math.max(0, bucket.income - bucket.expenses);
    const metGoal = bucket.count > 0 && savings >= target;

    months.push({
      month: label,
      income: bucket.income,
      expenses: bucket.expenses,
      savings,
      metGoal,
    });
  }

  // Calculate current streak (from most recent completed month backwards)
  let currentStreak = 0;
  // Start from month index 1 (last completed month) unless current month already met
  const startIdx = months[0].metGoal ? 0 : 1;
  for (let i = startIdx; i < months.length; i++) {
    if (months[i].metGoal) {
      currentStreak++;
    } else {
      break;
    }
  }

  return NextResponse.json(
    {
      months: months.reverse(), // chronological order
      currentStreak,
      bestStreak: Math.max(goals?.best_streak || 0, currentStreak),
      target,
    },
    { headers: { 'Cache-Control': 'private, max-age=600, stale-while-revalidate=120' } },
  );
});
