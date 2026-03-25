-- User spending statistics for anomaly detection (Welford's online algorithm)
CREATE TABLE user_spending_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL CHECK (stat_type IN ('merchant', 'category', 'overall')),
  stat_key TEXT NOT NULL,
  mean_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  stddev_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, stat_type, stat_key)
);

CREATE INDEX idx_spending_stats_user ON user_spending_stats(user_id);

ALTER TABLE user_spending_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own spending stats" ON user_spending_stats
  FOR SELECT USING (auth.uid() = user_id);
