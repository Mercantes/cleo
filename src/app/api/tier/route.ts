import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkTierLimit } from '@/lib/finance/tier-check';
import { TierFeature } from '@/lib/finance/tier-config';

const FEATURES: TierFeature[] = ['transactions', 'chat', 'bank_connections'];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await Promise.all(
    FEATURES.map(async (feature) => {
      const check = await checkTierLimit(user.id, feature);
      return { feature, ...check };
    }),
  );

  return NextResponse.json({ usage: results }, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  });
}
