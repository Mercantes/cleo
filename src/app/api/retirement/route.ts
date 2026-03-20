import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { withAuth } from '@/lib/utils/with-auth';
import { calculateProjections } from '@/lib/finance/projection-engine';
import { calculateRetirement } from '@/lib/finance/retirement-engine';

const retirementSchema = z.object({
  targetMonthlyIncome: z.coerce.number().min(0).max(1_000_000).default(5000),
  annualReturnRate: z.coerce.number().min(0).max(1).default(0.08),
  currentPortfolio: z.coerce.number().min(0).max(1_000_000_000).default(0),
});

export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  const raw = await request.json();
  const parsed = retirementSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parâmetros inválidos', details: parsed.error.issues }, { status: 400 });
  }
  const { targetMonthlyIncome, annualReturnRate, currentPortfolio } = parsed.data;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const startDate = sixMonthsAgo.toISOString().split('T')[0];

  const { data: transactions } = await supabase
    .from('transactions')
    .select('date, type, amount')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .order('date', { ascending: true });

  const { data: accounts } = await supabase
    .from('accounts')
    .select('balance, type')
    .eq('user_id', user.id);

  const bankTotal = accounts?.filter(a => a.type !== 'credit').reduce((sum, a) => sum + (a.balance || 0), 0) ?? 0;
  const creditTotal = accounts?.filter(a => a.type === 'credit').reduce((sum, a) => sum + (a.balance || 0), 0) ?? 0;
  const currentBalance = bankTotal - creditTotal;
  const projections = calculateProjections(transactions || [], currentBalance);

  const monthlySavings = projections.hasEnoughData
    ? projections.avgIncome - projections.avgExpenses
    : 0;

  const result = calculateRetirement({
    currentPortfolio,
    monthlySavings,
    targetMonthlyIncome,
    annualReturnRate,
  });

  return NextResponse.json(result);
});
