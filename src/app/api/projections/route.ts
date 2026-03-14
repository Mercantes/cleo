import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { calculateProjections } from '@/lib/finance/projection-engine';

export const GET = withAuth(async (_request, { supabase, user }) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const startDate = sixMonthsAgo.toISOString().split('T')[0];

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('date, type, amount')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .order('date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }

  const { data: accounts } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', user.id);

  const currentBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) ?? 0;

  const result = calculateProjections(transactions || [], currentBalance, 12);

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, max-age=1800, stale-while-revalidate=300' },
  });
});
