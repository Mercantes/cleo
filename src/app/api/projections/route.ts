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
    .select('balance, type')
    .eq('user_id', user.id);

  const bankTotal = accounts?.filter(a => a.type !== 'credit').reduce((sum, a) => sum + (a.balance || 0), 0) ?? 0;
  const creditTotal = accounts?.filter(a => a.type === 'credit').reduce((sum, a) => sum + (a.balance || 0), 0) ?? 0;
  const currentBalance = bankTotal - creditTotal;

  const result = calculateProjections(transactions || [], currentBalance, 12);

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, max-age=1800, stale-while-revalidate=300' },
  });
});
