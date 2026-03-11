import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createConnectToken } from '@/lib/pluggy/client';
import { PluggyError } from '@/lib/pluggy/types';
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
    const body = (await request.json().catch(() => ({}))) as { itemId?: string };

    // Only check tier limit for new connections (not reconnections)
    if (!body.itemId) {
      const tierCheck = await checkTierLimit(user.id, 'bank_connections');
      if (!tierCheck.allowed) {
        return NextResponse.json(
          {
            error: 'TIER_LIMIT_REACHED',
            feature: 'bank_connections',
            current: tierCheck.current,
            limit: tierCheck.limit,
            tier: tierCheck.tier,
            upgradeUrl: '/upgrade',
          },
          { status: 403 },
        );
      }
    }

    const token = await createConnectToken(body.itemId);

    return NextResponse.json({ accessToken: token.accessToken });
  } catch (error) {
    if (error instanceof PluggyError) {
      console.error('[pluggy-connect] Pluggy error:', error.message);
      return NextResponse.json(
        { error: 'Failed to connect to bank. Please try again.' },
        { status: error.statusCode || 500 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
