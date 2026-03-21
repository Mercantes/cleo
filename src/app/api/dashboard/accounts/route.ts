import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

// Normalize Pluggy connector names to clean display names
const BANK_DISPLAY_NAMES: Record<string, string> = {
  'itau': 'Itaú',
  'itaú': 'Itaú',
  'nubank': 'Nubank',
  'nu pagamentos': 'Nubank',
  'bradesco': 'Bradesco',
  'santander': 'Santander',
  'banco do brasil': 'Banco do Brasil',
  'caixa': 'Caixa',
  'inter': 'Inter',
  'c6 bank': 'C6 Bank',
  'c6': 'C6 Bank',
  'xp': 'XP',
  'xp investimentos': 'XP',
  'btg': 'BTG Pactual',
  'btg pactual': 'BTG Pactual',
  'safra': 'Safra',
  'rico': 'Rico',
  'modal': 'Modal',
  'mercado pago': 'Mercado Pago',
  'picpay': 'PicPay',
  'neon': 'Neon',
  'original': 'Banco Original',
  'sofisa': 'Sofisa',
  'pagbank': 'PagBank',
  'pagseguro': 'PagBank',
  'sicoob': 'Sicoob',
  'sicredi': 'Sicredi',
  'stone': 'Stone',
};

function normalizeBankName(connectorName: string): string {
  const lower = connectorName.toLowerCase().trim();
  // Direct match
  if (BANK_DISPLAY_NAMES[lower]) return BANK_DISPLAY_NAMES[lower];
  // Partial match
  for (const [key, display] of Object.entries(BANK_DISPLAY_NAMES)) {
    if (lower.includes(key) || key.includes(lower)) return display;
  }
  // Capitalize first letter of each word as fallback
  return connectorName
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

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

  let bankTotal = 0;
  let creditTotal = 0;

  for (const acc of accounts) {
    const balance = acc.balance || 0;
    if (acc.type === 'credit') {
      creditTotal += balance;
    } else {
      bankTotal += balance;
    }
  }

  const totalBalance = bankTotal - creditTotal;

  // Group accounts by bank (connector_name), consolidating all account types
  const grouped = new Map<string, {
    bankName: string;
    bankBalance: number;
    creditBalance: number;
    accountCount: number;
  }>();

  for (const acc of accounts) {
    const conn = acc.bank_connections as unknown as { connector_name: string } | null;
    const rawName = conn?.connector_name || 'Outros';
    const bankName = normalizeBankName(rawName);
    const existing = grouped.get(bankName);
    const balance = acc.balance || 0;

    if (existing) {
      if (acc.type === 'credit') {
        existing.creditBalance += balance;
      } else {
        existing.bankBalance += balance;
      }
      existing.accountCount += 1;
    } else {
      grouped.set(bankName, {
        bankName,
        bankBalance: acc.type === 'credit' ? 0 : balance,
        creditBalance: acc.type === 'credit' ? balance : 0,
        accountCount: 1,
      });
    }
  }

  // Sort: banks with highest absolute net balance first
  const consolidatedAccounts = [...grouped.values()]
    .sort((a, b) => Math.abs(b.bankBalance - b.creditBalance) - Math.abs(a.bankBalance - a.creditBalance));

  // Individual accounts for AccountsCard
  const individualAccounts = accounts.map((acc) => {
    const conn = acc.bank_connections as unknown as { connector_name: string } | null;
    return {
      id: acc.id,
      name: acc.name,
      type: acc.type,
      balance: acc.balance || 0,
      bankName: normalizeBankName(conn?.connector_name || 'Outros'),
    };
  });

  return NextResponse.json({
    accounts: individualAccounts,
    consolidatedAccounts,
    totalBalance,
    bankTotal,
    creditTotal,
    lastSyncAt: lastSync,
  }, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  });
});
