import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createItem } from '@/lib/pluggy/client';
import { PluggyError } from '@/lib/pluggy/types';

const SANDBOX_CONNECTOR_ID = 0; // Pluggy Bank (sandbox)
const SANDBOX_CREDENTIALS = { user: 'user-ok', password: 'password-ok' };

/**
 * POST /api/pluggy/test-sandbox
 *
 * Creates a sandbox item via Pluggy API (bypassing the Connect widget).
 * Returns the itemId immediately — frontend polls status then calls /api/pluggy/import.
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

  try {
    const item = await createItem(
      SANDBOX_CONNECTOR_ID,
      SANDBOX_CREDENTIALS,
      user.id,
    );

    return NextResponse.json({
      itemId: item.id,
      status: item.status,
    });
  } catch (error) {
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
