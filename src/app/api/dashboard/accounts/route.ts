import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, name, type, balance, bank_connections(connector_name)')
    .eq('user_id', user.id);

  if (error) {
    console.error('[dashboard/accounts] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const totalBalance = (accounts || []).reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return NextResponse.json({
    accounts: (accounts || []).map((acc) => {
      const conn = acc.bank_connections as { connector_name: string } | null;
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
}
