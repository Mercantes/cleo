-- Add CPF column to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cpf TEXT;

-- CPF format: 11 digits only (stored without mask)
-- Unique constraint ensures no duplicate CPFs
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf) WHERE cpf IS NOT NULL;
