import { NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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

  const { data: goals } = await db
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Calculate current month savings
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  const { data: transactions } = await db
    .from('transactions')
    .select('amount, type')
    .eq('user_id', user.id)
    .gte('date', monthStart)
    .lte('date', monthEnd);

  const income = (transactions || [])
    .filter((t: { type: string }) => t.type === 'credit')
    .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
  const expenses = (transactions || [])
    .filter((t: { type: string }) => t.type === 'debit')
    .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
  const currentSavings = Math.max(0, income - expenses);

  const target = goals?.monthly_savings_target ? Number(goals.monthly_savings_target) : 0;
  const progress = target > 0 ? Math.min(100, Math.round((currentSavings / target) * 100)) : 0;

  return NextResponse.json({
    goals: goals || null,
    progress: {
      currentSavings,
      target,
      percentage: progress,
      income,
      expenses,
    },
    gamification: {
      level: goals?.level || 1,
      xp: goals?.xp || 0,
      xpToNextLevel: ((goals?.level || 1) + 1) * 100,
      streak: goals?.streak_months || 0,
      bestStreak: goals?.best_streak || 0,
      totalChallengesCompleted: goals?.total_challenges_completed || 0,
    },
  });
}

export async function PUT(request: Request) {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { monthlySavingsTarget, retirementAgeTarget } = body;

  const db = getServiceClient();
  const { error } = await db.from('goals').upsert(
    {
      user_id: user.id,
      monthly_savings_target: monthlySavingsTarget || null,
      retirement_age_target: retirementAgeTarget || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('[goals] Update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
