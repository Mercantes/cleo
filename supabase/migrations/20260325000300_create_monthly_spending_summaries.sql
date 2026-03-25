-- Pre-computed monthly spending summaries for prediction engine
CREATE TABLE monthly_spending_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- YYYY-MM format
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  income DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expenses DECIMAL(12, 2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, period, category_id)
);

-- Partial unique index for rows without category (overall summary)
CREATE UNIQUE INDEX idx_monthly_summaries_overall
  ON monthly_spending_summaries(user_id, period)
  WHERE category_id IS NULL;

CREATE INDEX idx_monthly_summaries_user ON monthly_spending_summaries(user_id);

ALTER TABLE monthly_spending_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own monthly summaries" ON monthly_spending_summaries
  FOR SELECT USING (auth.uid() = user_id);
