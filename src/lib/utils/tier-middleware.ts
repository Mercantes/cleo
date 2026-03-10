import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TierFeature } from '@/lib/finance/tier-config';
import { checkTierLimit, incrementUsage } from '@/lib/finance/tier-check';

type NextHandler = (
  request: NextRequest,
  context?: unknown,
) => Promise<NextResponse | Response>;

export function withTierCheck(feature: TierFeature, handler: NextHandler) {
  return async (request: NextRequest, context?: unknown) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const check = await checkTierLimit(user.id, feature);
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'TIER_LIMIT_REACHED',
          feature,
          current: check.current,
          limit: check.limit,
          tier: check.tier,
          upgradeUrl: '/upgrade',
        },
        { status: 403 },
      );
    }

    const response = await handler(request, context);

    // Only increment for successful responses
    if (response.status >= 200 && response.status < 300) {
      await incrementUsage(user.id, feature);
    }

    return response;
  };
}
