-- Add Stripe-related columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMPTZ;

-- Index for Stripe customer lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
