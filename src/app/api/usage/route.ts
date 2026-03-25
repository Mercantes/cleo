import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { getUserTier } from '@/lib/finance/tier-check';
import { TIER_LIMITS, getCurrentPeriod } from '@/lib/finance/tier-config';
import { createAdminClient } from '@/lib/supabase/admin';

export const GET = withAuth(async (_request, { user }) => {
  const db = createAdminClient();
  const tier = await getUserTier(user.id);

  // Fetch grace period in parallel with usage data
  const gracePeriodPromise = db
    .from('profiles')
    .select('grace_period_until')
    .eq('id', user.id)
    .single()
    .then(({ data }) => data?.grace_period_until || null);

  if (tier === 'pro') {
    const gracePeriodUntil = await gracePeriodPromise;
    return NextResponse.json(
      {
        tier,
        transactions: { current: 0, limit: Infinity },
        chat: { current: 0, limit: Infinity },
        gracePeriodUntil,
      },
      { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' } },
    );
  }

  const period = getCurrentPeriod();

  const [usageRows, gracePeriodUntil] = await Promise.all([
    db
      .from('usage_tracking')
      .select('feature, count')
      .eq('user_id', user.id)
      .eq('period', period)
      .in('feature', ['transactions', 'chat'])
      .then(({ data }) => data),
    gracePeriodPromise,
  ]);

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
      gracePeriodUntil,
    },
    { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' } },
  );
});
