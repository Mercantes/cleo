-- User preferences for chat personalization
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'default' CHECK (source IN ('explicit', 'inferred', 'default')),
  confidence DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, preference_key)
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
