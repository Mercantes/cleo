import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getItem, getAccounts } from '@/lib/pluggy/client';
import { PluggyError } from '@/lib/pluggy/types';
import { syncTransactions } from '@/lib/pluggy/sync';
import { categorizeTransactions } from '@/lib/ai/categorize';
import { checkTierLimit } from '@/lib/finance/tier-check';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { itemId: string };

    if (!body.itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    // Check tier limit — prevent bypass by calling import directly
    const tierCheck = await checkTierLimit(user.id, 'bank_connections');
    // Allow if under limit OR if this is a reconnection (item already exists)
    if (!tierCheck.allowed) {
      const { data: existing } = await supabase
        .from('bank_connections')
        .select('id')
        .eq('pluggy_item_id', body.itemId)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        return NextResponse.json(
          {
            error: 'TIER_LIMIT_REACHED',
            feature: 'bank_connections',
            current: tierCheck.current,
            limit: tierCheck.limit,
          },
          { status: 403 },
        );
      }
    }

    // Fetch item details from Pluggy
    const item = await getItem(body.itemId);

    // Upsert bank connection — set last_sync_at to null initially (updated after sync)
    const { data: connection, error: connError } = await supabase
      .from('bank_connections')
      .upsert(
        {
          user_id: user.id,
          pluggy_item_id: body.itemId,
          connector_name: item.connector.name,
          status: item.status === 'UPDATED' ? 'active' : 'error',
        },
        { onConflict: 'pluggy_item_id' },
      )
      .select()
      .single();

    if (connError) {
      console.error('[pluggy-import] connection error:', connError.message);
      return NextResponse.json({ error: 'Failed to save bank connection' }, { status: 500 });
    }

    // Fetch and save accounts
    const pluggyAccounts = await getAccounts(body.itemId);
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

    // Sync transactions from Pluggy
    const syncResult = await syncTransactions(user.id, connection.id, body.itemId);

    // Update last_sync_at AFTER successful sync
    await supabase
      .from('bank_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id);

    // Categorize newly imported transactions via AI
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
      connectionId: connection.id,
      accountCount,
      transactionCount: syncResult.imported,
      categorized,
    });
  } catch (error) {
    if (error instanceof PluggyError) {
      console.error('[pluggy-import] Pluggy error:', error.message);
      return NextResponse.json(
        { error: 'Bank sync failed. Please try again.' },
        { status: error.statusCode || 500 },
      );
    }

    console.error('[pluggy-import] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
