import { createAdminClient } from '@/lib/supabase/admin';

const FREE_TIER_LIMIT = 30;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

function getBrazilPeriod(): string {
  const now = new Date();
  const brDate = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const [year, month] = brDate.split('-');
  return `${year}-${month}`;
}

export async function checkChatRateLimit(userId: string): Promise<RateLimitResult> {
  const supabase = createAdminClient();

  // Check user subscription tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const tier = profile?.subscription_tier || 'free';

  if (tier === 'pro') {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  const period = getBrazilPeriod();

  const { data: usage } = await supabase
    .from('chat_usage')
    .select('message_count')
    .eq('user_id', userId)
    .eq('period', period)
    .single();

  const currentCount = usage?.message_count || 0;
  const remaining = Math.max(0, FREE_TIER_LIMIT - currentCount);

  return {
    allowed: currentCount < FREE_TIER_LIMIT,
    remaining,
    limit: FREE_TIER_LIMIT,
  };
}

export async function incrementChatUsage(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const period = getBrazilPeriod();

  await supabase.rpc('increment_chat_usage', {
    p_user_id: userId,
    p_period: period,
  });
}
