import { createAdminClient } from '@/lib/supabase/admin';
import { Tier, TierFeature, TierCheckResult, TIER_LIMITS, getCurrentPeriod } from './tier-config';

export async function getUserTier(userId: string): Promise<Tier> {
  const supabase = createAdminClient();
  const { data } = await supabase.from('profiles').select('tier').eq('id', userId).single();

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

  const supabase = createAdminClient();

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

export async function incrementUsage(userId: string, feature: TierFeature): Promise<void> {
  // bank_connections are tracked by existing bank_connections table
  if (feature === 'bank_connections') return;

  const supabase = createAdminClient();
  const period = getCurrentPeriod();

  await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_feature: feature,
    p_period: period,
  });
}
