import { createAdminClient } from '@/lib/supabase/admin';
import { getAccounts, getItem } from './client';
import { mapPluggyAccountToDb } from './account-mapper';
import { syncTransactions } from './sync';
import { categorizeTransactions } from '@/lib/ai/categorize';
import { clearContextCache } from '@/lib/ai/financial-context';

export interface PluggyWebhookEvent {
  event: string;
  eventId?: string;
  itemId?: string;
  accountId?: string;
  triggeredBy?: string;
  clientUserId?: string;
  transactionsCount?: number;
  // Legacy nested format (kept for backwards compatibility)
  data?: {
    itemId?: string;
    accountId?: string;
    status?: string;
  };
}

export async function handleWebhookEvent(event: PluggyWebhookEvent): Promise<void> {
  const supabase = createAdminClient();

  // Support both flat (Pluggy actual format) and nested (legacy) payload
  const itemId = event.itemId || event.data?.itemId;

  if (!itemId) {
    console.error(
      '[pluggy-webhook] no itemId found in event:',
      JSON.stringify(event).substring(0, 300),
    );
    return;
  }

  const { data: connection } = await supabase
    .from('bank_connections')
    .select('id, user_id, last_sync_at')
    .eq('pluggy_item_id', itemId)
    .single();

  if (!connection) {
    console.warn('[pluggy-webhook] no connection found for itemId:', itemId);
    return;
  }

  console.warn('[pluggy-webhook] matched connection:', connection.id, 'event:', event.event);

  switch (event.event) {
    case 'item/updated': {
      // Pluggy flat format doesn't include status — fetch item to check
      let status: 'active' | 'error' = 'active';
      try {
        const item = await getItem(itemId);
        status = item.status === 'UPDATED' ? 'active' : 'error';
      } catch {
        console.warn('[pluggy-webhook] could not fetch item status, assuming active');
      }

      await supabase.from('bank_connections').update({ status }).eq('id', connection.id);

      // Upsert accounts with latest balances
      if (status === 'active') {
        const pluggyAccounts = await getAccounts(itemId);
        for (const acc of pluggyAccounts) {
          await supabase
            .from('accounts')
            .upsert(mapPluggyAccountToDb(acc, connection.user_id, connection.id), {
              onConflict: 'pluggy_account_id',
            });
        }
        clearContextCache(connection.user_id);
        console.warn('[pluggy-webhook] item/updated: accounts synced for', connection.id);
      }
      break;
    }

    case 'transactions/updated':
    case 'transactions/created': {
      // Incremental sync — only fetch since last sync
      const fromDate = connection.last_sync_at
        ? new Date(connection.last_sync_at).toISOString().split('T')[0]
        : undefined;

      const syncResult = await syncTransactions(
        connection.user_id,
        connection.id,
        itemId,
        fromDate,
      );

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

      console.warn('[pluggy-webhook] transactions synced:', syncResult, 'for', connection.id);
      break;
    }

    default:
      console.warn('[pluggy-webhook] unhandled event:', event.event);
  }
}
