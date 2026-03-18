-- Index for goals table (7 queries across API routes)
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- Composite index for category_budgets (upserts use both columns)
CREATE INDEX IF NOT EXISTS idx_category_budgets_user_category ON category_budgets(user_id, category_id);

-- Index for chat_usage (account cleanup, rate limiting)
CREATE INDEX IF NOT EXISTS idx_chat_usage_user ON chat_usage(user_id);
