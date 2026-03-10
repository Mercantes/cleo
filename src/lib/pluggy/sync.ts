import { createClient } from '@supabase/supabase-js';
import { getTransactions } from './client';
import type { PluggyTransaction } from './types';

export interface SyncResult {
  imported: number;
  skipped: number;
  errors: number;
}

function mapTransaction(
  tx: PluggyTransaction,
  userId: string,
  accountId: string,
) {
  return {
    user_id: userId,
    account_id: accountId,
    pluggy_transaction_id: tx.id,
    description: tx.description,
    amount: Math.abs(tx.amount),
    date: tx.date.split('T')[0], // ISO date only
    type: tx.type === 'DEBIT' ? 'debit' : 'credit',
    raw_category: tx.category || null,
    merchant: tx.paymentData?.receiver?.name || null,
    installment_number: tx.creditCardMetadata?.installmentNumber || null,
    installment_total: tx.creditCardMetadata?.totalInstallments || null,
  };
}

export async function syncTransactions(
  userId: string,
  bankConnectionId: string,
  itemId: string,
  fromDate?: string,
): Promise<SyncResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const result: SyncResult = { imported: 0, skipped: 0, errors: 0 };

  // Get accounts for this connection
  const { data: dbAccounts } = await supabase
    .from('accounts')
    .select('id, pluggy_account_id')
    .eq('bank_connection_id', bankConnectionId);

  if (!dbAccounts || dbAccounts.length === 0) return result;

  const from = fromDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const to = new Date().toISOString().split('T')[0];

  for (const dbAccount of dbAccounts) {
    try {
      const transactions = await getTransactions(dbAccount.pluggy_account_id, from, to);

      if (transactions.length === 0) continue;

      const mapped = transactions.map((tx) =>
        mapTransaction(tx, userId, dbAccount.id),
      );

      // Batch upsert with deduplication — ON CONFLICT DO NOTHING
      const { data, error } = await supabase
        .from('transactions')
        .upsert(mapped, {
          onConflict: 'pluggy_transaction_id',
          ignoreDuplicates: true,
        })
        .select('id');

      if (error) {
        result.errors += mapped.length;
      } else {
        result.imported += data?.length || 0;
        result.skipped += mapped.length - (data?.length || 0);
      }
    } catch {
      result.errors++;
    }
  }

  return result;
}
