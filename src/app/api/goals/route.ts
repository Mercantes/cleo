import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { goalSchema, parseBody } from '@/lib/validations/api';

export const GET = withAuth(async (_request, { user }) => {
  const db = createAdminClient();

  const { data: goals } = await db.from('goals').select('*').eq('user_id', user.id).single();

  // Calculate current month savings
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

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

  return NextResponse.json(
    {
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
    },
    { headers: { 'Cache-Control': 'private, max-age=600, stale-while-revalidate=120' } },
  );
});

export const PUT = withAuth(async (request, { user }) => {
  const body = await request.json();
  const parsed = parseBody(goalSchema, {
    monthlySavingsTarget:
      body.monthlySavingsTarget != null ? Number(body.monthlySavingsTarget) : undefined,
    retirementAge: body.retirementAgeTarget != null ? Number(body.retirementAgeTarget) : undefined,
    emergencyFundBalance:
      body.emergencyFundBalance != null ? Number(body.emergencyFundBalance) : undefined,
  });
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || 'Dados inválidos' }, { status: 400 });
  }
  const savings = parsed.data.monthlySavingsTarget ?? null;
  const retAge = parsed.data.retirementAge ?? null;
  const emergencyFund = parsed.data.emergencyFundBalance ?? undefined;

  const db = createAdminClient();
  const { error } = await db.from('goals').upsert(
    {
      user_id: user.id,
      monthly_savings_target: savings ?? undefined,
      retirement_age_target: retAge ?? undefined,
      emergency_fund_balance: emergencyFund,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('[goals] Update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
