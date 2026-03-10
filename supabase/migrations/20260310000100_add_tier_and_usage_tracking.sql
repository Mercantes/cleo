-- Add tier column to profiles (default 'free')
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
  CHECK (tier IN ('free', 'pro'));

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature, period)
);

-- RLS policies
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_tracking' AND policyname = 'Users read own usage') THEN
    CREATE POLICY "Users read own usage" ON usage_tracking FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_tracking' AND policyname = 'Service role manages usage') THEN
    CREATE POLICY "Service role manages usage" ON usage_tracking FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period
  ON usage_tracking(user_id, feature, period);
