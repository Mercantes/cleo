-- Add user_override column to allow manual reclassification
ALTER TABLE recurring_transactions
  ADD COLUMN IF NOT EXISTS user_override TEXT CHECK (user_override IN ('subscription', 'installment'));

-- Update status check to include 'completed' (for finished installments)
-- The existing check allows: 'active', 'cancelled', 'completed' — already correct
