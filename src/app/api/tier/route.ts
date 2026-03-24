import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/utils/with-auth';
import { checkTierLimit } from '@/lib/finance/tier-check';
import { TierFeature } from '@/lib/finance/tier-config';

const FEATURES: TierFeature[] = ['transactions', 'chat', 'bank_connections'];

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export const GET = withAuth(async (_request, { user }) => {
  const [results, gracePeriod] = await Promise.all([
    Promise.all(
      FEATURES.map(async (feature) => {
        const check = await checkTierLimit(user.id, feature);
        return { feature, ...check };
      }),
    ),
    getServiceClient()
      .from('profiles')
      .select('grace_period_until')
      .eq('id', user.id)
      .single()
      .then(({ data }) => data?.grace_period_until || null),
  ]);

  return NextResponse.json({ usage: results, gracePeriodUntil: gracePeriod }, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  });
});
