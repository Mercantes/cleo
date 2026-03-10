-- Add onboarding columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_skipped_steps TEXT[] NOT NULL DEFAULT '{}';

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  monthly_savings_target DECIMAL(12,2),
  retirement_age_target INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users read own goals') THEN
    CREATE POLICY "Users read own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users manage own goals') THEN
    CREATE POLICY "Users manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
