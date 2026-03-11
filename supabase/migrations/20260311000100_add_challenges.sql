-- Challenges / Gamification system
-- Adds challenges table and extends goals with progress tracking

-- Challenges: system-defined or AI-generated savings challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'savings', -- savings, spending_limit, no_spend, custom
  target_amount DECIMAL(12,2),
  current_amount DECIMAL(12,2) DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, failed, cancelled
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add streak tracking to goals
ALTER TABLE goals ADD COLUMN IF NOT EXISTS streak_months INT DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS best_streak INT DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS total_challenges_completed INT DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;

-- RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
  ON challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own challenges"
  ON challenges FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_challenges_user_status ON challenges(user_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON challenges(end_date);
