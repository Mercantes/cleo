import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (_request, { supabase, user }) => {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, name, type, balance, bank_connections(connector_name)')
    .eq('user_id', user.id);

  if (error) {
    console.error('[dashboard/accounts] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const totalBalance = (accounts || []).reduce((sum, acc) => {
    const balance = acc.balance || 0;
    // Credit card balances represent debt — subtract from net worth
    return acc.type === 'credit' ? sum - balance : sum + balance;
  }, 0);

  return NextResponse.json({
    accounts: (accounts || []).map((acc) => {
      const conn = acc.bank_connections as unknown as { connector_name: string } | null;
      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance: acc.balance || 0,
        bankName: conn?.connector_name || 'Banco',
      };
    }),
    totalBalance,
  }, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  });
});
