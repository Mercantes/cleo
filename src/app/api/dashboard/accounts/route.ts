import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (_request, { supabase, user }) => {
  const [accountsResult, connectionsResult] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, type, balance, bank_connections(connector_name)')
      .eq('user_id', user.id),
    supabase
      .from('bank_connections')
      .select('last_sync_at, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('last_sync_at', { ascending: false })
      .limit(1),
  ]);

  if (accountsResult.error) {
    console.error('[dashboard/accounts] query failed:', accountsResult.error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const accounts = accountsResult.data || [];
  const lastSync = connectionsResult.data?.[0]?.last_sync_at || null;

  const totalBalance = accounts.reduce((sum, acc) => {
    const balance = acc.balance || 0;
    return acc.type === 'credit' ? sum - balance : sum + balance;
  }, 0);

  return NextResponse.json({
    accounts: accounts.map((acc) => {
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
    lastSyncAt: lastSync,
  }, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  });
});
