import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { checkTierLimit } from '@/lib/finance/tier-check';
import { TierFeature } from '@/lib/finance/tier-config';

const FEATURES: TierFeature[] = ['transactions', 'chat', 'bank_connections'];

export const GET = withAuth(async (_request, { user }) => {
  const results = await Promise.all(
    FEATURES.map(async (feature) => {
      const check = await checkTierLimit(user.id, feature);
      return { feature, ...check };
    }),
  );

  return NextResponse.json({ usage: results }, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  });
});
