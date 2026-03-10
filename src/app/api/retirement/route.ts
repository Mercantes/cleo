import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateProjections } from '@/lib/finance/projection-engine';
import { calculateRetirement } from '@/lib/finance/retirement-engine';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const targetMonthlyIncome = Number(body.targetMonthlyIncome) || 5000;
  const annualReturnRate = Number(body.annualReturnRate) || 0.08;
  const currentPortfolio = Number(body.currentPortfolio) || 0;

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
