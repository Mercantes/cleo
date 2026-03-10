import { createClient } from '@supabase/supabase-js';

const FREE_TIER_LIMIT = 30;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export async function checkChatRateLimit(userId: string): Promise<RateLimitResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

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

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Try to increment existing record
  const { data: existing } = await supabase
    .from('chat_usage')
    .select('id, message_count')
    .eq('user_id', userId)
    .eq('period', period)
    .single();

  if (existing) {
    await supabase
      .from('chat_usage')
      .update({ message_count: existing.message_count + 1 })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('chat_usage')
      .insert({ user_id: userId, period, message_count: 1 });
  }
}
