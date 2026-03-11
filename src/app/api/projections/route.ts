import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateProjections } from '@/lib/finance/projection-engine';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch last 6 months of transactions
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

  // Get current balance from accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', user.id);

  const currentBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) ?? 0;

  const result = calculateProjections(transactions || [], currentBalance, 12);

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, max-age=1800, stale-while-revalidate=300' },
  });
}
