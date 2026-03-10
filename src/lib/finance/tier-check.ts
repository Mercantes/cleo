import { createClient } from '@supabase/supabase-js';
import { Tier, TierFeature, TierCheckResult, TIER_LIMITS, getCurrentPeriod } from './tier-config';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function getUserTier(userId: string): Promise<Tier> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();

  return (data?.tier as Tier) || 'free';
}

export async function checkTierLimit(
  userId: string,
  feature: TierFeature,
): Promise<TierCheckResult> {
  const tier = await getUserTier(userId);
  const limit = TIER_LIMITS[tier][feature];

  if (limit === Infinity) {
    return { allowed: true, current: 0, limit, tier };
  }

  const supabase = getServiceClient();

  // bank_connections is a total count, not per-period
  if (feature === 'bank_connections') {
    const { count } = await supabase
      .from('bank_connections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    const current = count || 0;
    return { allowed: current < limit, current, limit, tier };
  }

  // Monthly features use usage_tracking
  const period = getCurrentPeriod();
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('period', period)
    .single();

  const current = usage?.count || 0;
  return { allowed: current < limit, current, limit, tier };
}

export async function incrementUsage(
  userId: string,
  feature: TierFeature,
): Promise<void> {
  // bank_connections are tracked by existing bank_connections table
  if (feature === 'bank_connections') return;

  const supabase = getServiceClient();
  const period = getCurrentPeriod();

  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('id, count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('period', period)
    .single();

  if (existing) {
    await supabase
      .from('usage_tracking')
      .update({ count: existing.count + 1 })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('usage_tracking')
      .insert({ user_id: userId, feature, count: 1, period });
  }
}
