-- Learning events: unified store for all ML learning signals
CREATE TABLE learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'category_correction', 'anomaly_feedback', 'insight_feedback', 'preference_learned'
  )),
  entity_id UUID,
  entity_type TEXT,
  old_value JSONB,
  new_value JSONB,
  merchant_pattern TEXT,
  auto_rule_created BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_events_user ON learning_events(user_id);
CREATE INDEX idx_learning_events_type ON learning_events(user_id, event_type);
CREATE INDEX idx_learning_events_merchant ON learning_events(user_id, merchant_pattern)
  WHERE event_type = 'category_correction';

ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own learning events" ON learning_events
  FOR ALL USING (auth.uid() = user_id);
