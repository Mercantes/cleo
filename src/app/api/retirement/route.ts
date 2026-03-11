import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createClient } from '@/lib/supabase/server';
import { calculateProjections } from '@/lib/finance/projection-engine';
import { calculateRetirement } from '@/lib/finance/retirement-engine';

const retirementSchema = z.object({
  targetMonthlyIncome: z.coerce.number().min(0).max(1_000_000).default(5000),
  annualReturnRate: z.coerce.number().min(0).max(1).default(0.08),
  currentPortfolio: z.coerce.number().min(0).max(1_000_000_000).default(0),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await request.json();
  const parsed = retirementSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parâmetros inválidos', details: parsed.error.issues }, { status: 400 });
  }
  const { targetMonthlyIncome, annualReturnRate, currentPortfolio } = parsed.data;

  // Get savings rate from projection engine
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
    .select('balance')
    .eq('user_id', user.id);

  const currentBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) ?? 0;
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
}
