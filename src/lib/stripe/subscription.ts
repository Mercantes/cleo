import { stripe } from './client';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function getOrCreateCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const supabase = getServiceClient();

  // Check if user already has a Stripe customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  // Store customer ID
  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

export async function updateUserTier(
  stripeCustomerId: string,
  tier: 'free' | 'pro',
  subscriptionId?: string,
  subscriptionStatus?: string,
): Promise<void> {
  const supabase = getServiceClient();

  const update: Record<string, unknown> = {
    tier,
    subscription_status: subscriptionStatus || (tier === 'pro' ? 'active' : null),
  };

  if (subscriptionId !== undefined) {
    update.stripe_subscription_id = subscriptionId;
  }

  await supabase
    .from('profiles')
    .update(update)
    .eq('stripe_customer_id', stripeCustomerId);
}

export async function setGracePeriod(
  stripeCustomerId: string,
  days: number = 7,
): Promise<void> {
  const supabase = getServiceClient();
  const until = new Date();
  until.setDate(until.getDate() + days);

  await supabase
    .from('profiles')
    .update({ grace_period_until: until.toISOString() })
    .eq('stripe_customer_id', stripeCustomerId);
}

export async function isInGracePeriod(userId: string): Promise<boolean> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('grace_period_until')
    .eq('id', userId)
    .single();

  if (!data?.grace_period_until) return false;
  return new Date(data.grace_period_until) > new Date();
}
