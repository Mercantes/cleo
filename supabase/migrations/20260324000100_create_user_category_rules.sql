-- User-defined category rules for auto-categorization
CREATE TABLE user_category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_pattern TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains', 'exact')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, merchant_pattern)
);

CREATE INDEX idx_user_category_rules_user ON user_category_rules(user_id);
ALTER TABLE user_category_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own category rules" ON user_category_rules
  FOR ALL USING (auth.uid() = user_id);
