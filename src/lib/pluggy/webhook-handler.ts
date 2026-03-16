import { createClient } from '@supabase/supabase-js';
import { getAccounts } from './client';
import { mapPluggyAccountToDb } from './account-mapper';
import { syncTransactions } from './sync';
import { categorizeTransactions } from '@/lib/ai/categorize';
import { clearContextCache } from '@/lib/ai/financial-context';

export interface PluggyWebhookEvent {
  event: string;
  data: {
    itemId: string;
    accountId?: string;
    status?: string;
  };
}

export async function handleWebhookEvent(event: PluggyWebhookEvent): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: connection } = await supabase
    .from('bank_connections')
    .select('id, user_id, last_sync_at')
    .eq('pluggy_item_id', event.data.itemId)
    .single();

  if (!connection) return;

  switch (event.event) {
    case 'item/updated': {
      const status = event.data.status === 'UPDATED' ? 'active' : 'error';
      await supabase
        .from('bank_connections')
        .update({ status })
        .eq('id', connection.id);

      // Upsert accounts with latest balances
      if (status === 'active') {
        const pluggyAccounts = await getAccounts(event.data.itemId);
        for (const acc of pluggyAccounts) {
          await supabase.from('accounts').upsert(
            mapPluggyAccountToDb(acc, connection.user_id, connection.id),
            { onConflict: 'pluggy_account_id' },
          );
        }
        // Invalidate AI context cache so Cleo chat reflects new balances
        clearContextCache(connection.user_id);
      }
      break;
    }

    case 'transactions/updated': {
      // Incremental sync — only fetch since last sync
      const fromDate = connection.last_sync_at
        ? new Date(connection.last_sync_at).toISOString().split('T')[0]
        : undefined;

      const syncResult = await syncTransactions(
        connection.user_id,
        connection.id,
        event.data.itemId,
        fromDate,
      );

      // Invalidate AI context cache so Cleo chat uses fresh data
      clearContextCache(connection.user_id);

      // Categorize new transactions
      if (syncResult.imported > 0) {
        const { data: uncategorized } = await supabase
          .from('transactions')
          .select('id, description, amount, type')
          .eq('user_id', connection.user_id)
          .is('category_id', null)
          .limit(200);

        if (uncategorized && uncategorized.length > 0) {
          await categorizeTransactions(uncategorized);
        }
      }

      // Update last_sync_at
      await supabase
        .from('bank_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connection.id);

      break;
    }
  }
}
