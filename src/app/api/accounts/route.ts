import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (_request, { supabase, user }) => {
  // Fetch accounts with their bank connection info
  const { data: accounts, error: accError } = await supabase
    .from('accounts')
    .select('id, name, type, balance, currency, bank_connection_id, bank_connections(id, connector_name, connector_logo_url)')
    .eq('user_id', user.id)
    .order('type')
    .order('balance', { ascending: false });

  if (accError) {
    console.error('[accounts] accounts query failed:', accError.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Fetch bank connections
  const { data: connections, error: connError } = await supabase
    .from('bank_connections')
    .select('id, connector_name, connector_logo_url, status, last_sync_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (connError) {
    console.error('[accounts] connections query failed:', connError.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const items = (accounts || []).map((acc) => {
    const conn = acc.bank_connections as unknown as {
      id: string;
      connector_name: string;
      connector_logo_url: string | null;
    } | null;
    return {
      id: acc.id,
      name: acc.name,
      type: acc.type as 'checking' | 'savings' | 'credit',
      balance: acc.balance || 0,
      currency: acc.currency || 'BRL',
      bankName: conn?.connector_name || 'Banco',
      bankLogo: conn?.connector_logo_url || null,
    };
  });

  const creditCards = items.filter((a) => a.type === 'credit');
  const bankAccounts = items.filter((a) => a.type !== 'credit');

  const creditTotal = creditCards.reduce((sum, a) => sum + a.balance, 0);
  const bankTotal = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

  // Count accounts per connection
  const connectionAccountCounts: Record<string, number> = {};
  for (const acc of accounts || []) {
    const connId = acc.bank_connection_id;
    if (connId) {
      connectionAccountCounts[connId] = (connectionAccountCounts[connId] || 0) + 1;
    }
  }

  const connectionsWithCounts = (connections || []).map((c) => ({
    id: c.id,
    connectorName: c.connector_name,
    connectorLogo: c.connector_logo_url,
    status: c.status,
    lastSyncAt: c.last_sync_at,
    accountCount: connectionAccountCounts[c.id] || 0,
  }));

  return NextResponse.json({
    creditCards,
    bankAccounts,
    connections: connectionsWithCounts,
    creditTotal,
    bankTotal,
  }, {
    headers: { 'Cache-Control': 'private, no-cache' },
  });
});
