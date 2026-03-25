import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { checkTierLimit } from '@/lib/finance/tier-check';
import { createAdminClient } from '@/lib/supabase/admin';
import { TierFeature } from '@/lib/finance/tier-config';

const FEATURES: TierFeature[] = ['transactions', 'chat', 'bank_connections'];

export const GET = withAuth(async (_request, { user }) => {
  const [results, gracePeriod] = await Promise.all([
    Promise.all(
      FEATURES.map(async (feature) => {
        const check = await checkTierLimit(user.id, feature);
        return { feature, ...check };
      }),
    ),
    createAdminClient()
      .from('profiles')
      .select('grace_period_until')
      .eq('id', user.id)
      .single()
      .then(({ data }) => data?.grace_period_until || null),
  ]);

  return NextResponse.json(
    { usage: results, gracePeriodUntil: gracePeriod },
    {
      headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
    },
  );
});
