import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncTransactions } from '@/lib/pluggy/sync';
import { getAccounts, updateItem, getItem } from '@/lib/pluggy/client';
import { mapPluggyAccountToDb } from '@/lib/pluggy/account-mapper';
import { categorizeTransactions } from '@/lib/ai/categorize';

export const maxDuration = 120; // Allow up to 120s — includes Pluggy refresh wait + sync

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Get all active bank connections
  const { data: connections, error } = await supabase
    .from('bank_connections')
    .select('id, user_id, pluggy_item_id, connector_name')
    .eq('status', 'active');

  if (error || !connections?.length) {
    console.warn('[cron/sync-banks] No active connections to sync');
    return NextResponse.json({ synced: 0 });
  }

  const results: { connection: string; imported: number; categorized: number; error?: string }[] = [];

  for (const conn of connections) {
    try {
      // Request Pluggy to refresh data from the bank
      await updateItem(conn.pluggy_item_id);

      // Wait for Pluggy to finish updating (poll up to ~45s)
      let itemReady = false;
      for (let i = 0; i < 9; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const item = await getItem(conn.pluggy_item_id);
        if (item.status === 'UPDATED') {
          itemReady = true;
          break;
        }
        if (item.status !== 'UPDATING') break;
      }

      if (!itemReady) {
        console.warn(`[cron/sync-banks] ${conn.connector_name}: item still updating, syncing with available data`);
      }

      // Upsert accounts (create new + update existing balances)
      const pluggyAccounts = await getAccounts(conn.pluggy_item_id);
      for (const acc of pluggyAccounts) {
        await supabase.from('accounts').upsert(
          mapPluggyAccountToDb(acc, conn.user_id, conn.id),
          { onConflict: 'pluggy_account_id' },
        );
      }

      // Sync transactions (last 90 days by default)
      const syncResult = await syncTransactions(conn.user_id, conn.id, conn.pluggy_item_id);

      // Update last_sync_at
      await supabase
        .from('bank_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', conn.id);

      // Categorize new transactions
      let categorized = 0;
      if (syncResult.imported > 0) {
        const { data: uncategorized } = await supabase
          .from('transactions')
          .select('id, description, amount, type')
          .eq('user_id', conn.user_id)
          .is('category_id', null)
          .limit(200);

        if (uncategorized && uncategorized.length > 0) {
          categorized = await categorizeTransactions(uncategorized);
        }
      }

      results.push({
        connection: conn.connector_name,
        imported: syncResult.imported,
        categorized,
      });

      console.warn(`[cron/sync-banks] ${conn.connector_name}: ${syncResult.imported} imported, ${categorized} categorized`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[cron/sync-banks] ${conn.connector_name} failed:`, message);

      // Mark connection as error
      await supabase
        .from('bank_connections')
        .update({ status: 'error' })
        .eq('id', conn.id);

      results.push({
        connection: conn.connector_name,
        imported: 0,
        categorized: 0,
        error: message,
      });
    }
  }

  const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
  console.warn(`[cron/sync-banks] Done. ${connections.length} connections, ${totalImported} total imported`);

  return NextResponse.json({
    synced: connections.length,
    totalImported,
    results,
  });
}
