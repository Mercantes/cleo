import { NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/finance/tier-check';
import { TIER_LIMITS, getCurrentPeriod } from '@/lib/finance/tier-config';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tier = await getUserTier(user.id);

  if (tier === 'pro') {
    return NextResponse.json(
      { tier, transactions: { current: 0, limit: Infinity }, chat: { current: 0, limit: Infinity } },
      { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' } },
    );
  }

  const db = getServiceClient();
  const period = getCurrentPeriod();

  const { data: usageRows } = await db
    .from('usage_tracking')
    .select('feature, count')
    .eq('user_id', user.id)
    .eq('period', period)
    .in('feature', ['transactions', 'chat']);

  const usageMap: Record<string, number> = {};
  for (const row of usageRows || []) {
    usageMap[row.feature] = row.count;
  }

  return NextResponse.json(
    {
      tier,
      transactions: {
        current: usageMap['transactions'] || 0,
        limit: TIER_LIMITS.free.transactions,
      },
      chat: {
        current: usageMap['chat'] || 0,
        limit: TIER_LIMITS.free.chat,
      },
    },
    { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' } },
  );
}
