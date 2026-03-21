-- Add emergency fund balance field to goals table
-- Allows users to manually set how much of their balance is reserved for emergencies
ALTER TABLE goals ADD COLUMN IF NOT EXISTS emergency_fund_balance DECIMAL(12,2);
