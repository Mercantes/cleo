import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { syncTransactions } from '@/lib/pluggy/sync';
import { categorizeTransactions } from '@/lib/ai/categorize';
import { rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

export const maxDuration = 60; // Sync + AI categorization needs time

export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  // Rate limit: 3 requests/min per user
  const rl = rateLimit(`pluggy-sync:${user.id}`, RATE_LIMITS['pluggy-sync']);
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
    const body = (await request.json()) as { connectionId: string };

    if (!body.connectionId) {
      return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
    }

    // Verify ownership and get pluggy_item_id
    const { data: connection, error: connError } = await supabase
      .from('bank_connections')
      .select('id, pluggy_item_id')
      .eq('id', body.connectionId)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Update status to updating
    await supabase
      .from('bank_connections')
      .update({ status: 'updating' })
      .eq('id', connection.id);

    // Sync transactions
    const syncResult = await syncTransactions(user.id, connection.id, connection.pluggy_item_id);

    // Update connection status
    await supabase
      .from('bank_connections')
      .update({ status: 'active', last_sync_at: new Date().toISOString() })
      .eq('id', connection.id);

    // Categorize uncategorized transactions (always check, not just new imports)
    let categorized = 0;
    const { data: uncategorized } = await supabase
      .from('transactions')
      .select('id, description, amount, type')
      .eq('user_id', user.id)
      .is('category_id', null)
      .limit(200);

    console.warn(`[pluggy-sync] imported=${syncResult.imported} uncategorized=${uncategorized?.length || 0}`);

    if (uncategorized && uncategorized.length > 0) {
      categorized = await categorizeTransactions(uncategorized);
    }

    console.warn(`[pluggy-sync] categorized=${categorized}`);

    return NextResponse.json({
      success: true,
      imported: syncResult.imported,
      categorized,
    });
  } catch (error) {
    console.error('[pluggy-sync] error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
});
