import { NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface MonthResult {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  metGoal: boolean;
}

export async function GET() {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceClient();

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

  // Get last 12 months of transaction data
  const now = new Date();
  const months: MonthResult[] = [];

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

    const { data: transactions } = await db
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const txs = transactions || [];
    const income = txs
      .filter((t: { type: string }) => t.type === 'credit')
      .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
    const expenses = txs
      .filter((t: { type: string }) => t.type === 'debit')
      .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
    const savings = Math.max(0, income - expenses);

    // Current month is "in progress" — only count as met if already exceeded
    const isCurrent = i === 0;
    const metGoal = isCurrent ? savings >= target : savings >= target;

    months.push({
      month: label,
      income,
      expenses,
      savings,
      metGoal: txs.length === 0 ? false : metGoal,
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
}
