import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { getItem, getAccounts } from '@/lib/pluggy/client';
import { PluggyError } from '@/lib/pluggy/types';
import { mapPluggyAccountToDb } from '@/lib/pluggy/account-mapper';
import { syncTransactions } from '@/lib/pluggy/sync';
import { categorizeTransactions } from '@/lib/ai/categorize';
import { checkTierLimit } from '@/lib/finance/tier-check';
import { rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

export const maxDuration = 60; // Sync + AI categorization needs time

export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  // Rate limit: 3 requests/min per user
  const rl = rateLimit(`pluggy-import:${user.id}`, RATE_LIMITS['pluggy-import']);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
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
          connector_logo_url: item.connector.imageUrl || null,
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
      const { error: accError } = await supabase.from('accounts').upsert(
        mapPluggyAccountToDb(acc, user.id, connection.id),
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

    // Categorize uncategorized transactions via AI (always check, not just new imports)
    let categorized = 0;
    const { data: uncategorized } = await supabase
      .from('transactions')
      .select('id, description, amount, type')
      .eq('user_id', user.id)
      .is('category_id', null)
      .limit(200);

    if (uncategorized && uncategorized.length > 0) {
      categorized = await categorizeTransactions(uncategorized);
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
});
