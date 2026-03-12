import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createItem, getItem, getAccounts, deleteItem } from '@/lib/pluggy/client';
import { PluggyError } from '@/lib/pluggy/types';
import { syncTransactions } from '@/lib/pluggy/sync';
import { categorizeTransactions } from '@/lib/ai/categorize';

const SANDBOX_CONNECTOR_ID = 0; // Pluggy Bank (sandbox)
const SANDBOX_CREDENTIALS = { user: 'user-ok', password: 'password-ok' };
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30; // 60 seconds max

async function waitForItemReady(itemId: string): Promise<string> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const item = await getItem(itemId);

    if (item.status === 'UPDATED') return 'UPDATED';
    if (item.status === 'LOGIN_ERROR' || item.status === 'OUTDATED') {
      return item.status;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return 'TIMEOUT';
}

/**
 * POST /api/pluggy/test-sandbox
 *
 * Creates a sandbox bank connection via Pluggy API (bypassing the Connect widget)
 * and imports accounts + transactions. For E2E testing in Development mode.
 *
 * Only available when NEXT_PUBLIC_PLUGGY_SANDBOX=true
 */
export async function POST() {
  if (process.env.NEXT_PUBLIC_PLUGGY_SANDBOX !== 'true') {
    return NextResponse.json(
      { error: 'Sandbox testing is only available in development mode' },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let itemId: string | null = null;

  try {
    // Step 1: Create sandbox item via API
    const item = await createItem(
      SANDBOX_CONNECTOR_ID,
      SANDBOX_CREDENTIALS,
      user.id,
    );
    itemId = item.id;

    // Step 2: Poll until item is ready
    const status = await waitForItemReady(itemId);

    if (status !== 'UPDATED') {
      // Cleanup failed item
      await deleteItem(itemId).catch(() => {});
      return NextResponse.json(
        { error: `Sandbox connection failed: ${status}` },
        { status: 502 },
      );
    }

    // Step 3: Get final item details
    const updatedItem = await getItem(itemId);

    // Step 4: Upsert bank connection
    const { data: connection, error: connError } = await supabase
      .from('bank_connections')
      .upsert(
        {
          user_id: user.id,
          pluggy_item_id: itemId,
          connector_name: updatedItem.connector.name,
          status: 'active',
        },
        { onConflict: 'pluggy_item_id' },
      )
      .select()
      .single();

    if (connError) {
      return NextResponse.json(
        { error: `DB error: ${connError.message}` },
        { status: 500 },
      );
    }

    // Step 5: Fetch and save accounts
    const pluggyAccounts = await getAccounts(itemId);
    let accountCount = 0;

    for (const acc of pluggyAccounts) {
      const accountType =
        acc.subtype === 'SAVINGS_ACCOUNT'
          ? 'savings'
          : acc.type === 'CREDIT'
            ? 'credit'
            : 'checking';

      const { error: accError } = await supabase.from('accounts').upsert(
        {
          user_id: user.id,
          bank_connection_id: connection.id,
          pluggy_account_id: acc.id,
          name: acc.name,
          type: accountType,
          balance: acc.balance,
          currency: acc.currencyCode || 'BRL',
        },
        { onConflict: 'pluggy_account_id' },
      );

      if (!accError) accountCount++;
    }

    // Step 6: Sync transactions
    const syncResult = await syncTransactions(user.id, connection.id, itemId);

    // Step 7: Update last sync
    await supabase
      .from('bank_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id);

    // Step 8: Categorize transactions via AI
    let categorized = 0;
    if (syncResult.imported > 0) {
      const { data: uncategorized } = await supabase
        .from('transactions')
        .select('id, description, amount, type')
        .eq('user_id', user.id)
        .is('category_id', null)
        .limit(200);

      if (uncategorized && uncategorized.length > 0) {
        categorized = await categorizeTransactions(uncategorized);
      }
    }

    return NextResponse.json({
      success: true,
      sandbox: true,
      itemId,
      connectionId: connection.id,
      connectorName: updatedItem.connector.name,
      accountCount,
      transactionCount: syncResult.imported,
      categorized,
    });
  } catch (error) {
    // Cleanup on failure
    if (itemId) {
      await deleteItem(itemId).catch(() => {});
    }

    if (error instanceof PluggyError) {
      console.error('[pluggy-test-sandbox] Pluggy error:', error.message);
      return NextResponse.json(
        { error: `Pluggy error: ${error.message}` },
        { status: error.statusCode || 500 },
      );
    }

    console.error('[pluggy-test-sandbox] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
