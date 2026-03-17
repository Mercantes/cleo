-- Add 'dismissed' as valid user_override and status value for persistent dismissals
ALTER TABLE recurring_transactions
  DROP CONSTRAINT IF EXISTS recurring_transactions_user_override_check;

ALTER TABLE recurring_transactions
  ADD CONSTRAINT recurring_transactions_user_override_check
  CHECK (user_override IN ('subscription', 'installment', 'income', 'dismissed'));

-- Also allow 'dismissed' in status column
ALTER TABLE recurring_transactions
  DROP CONSTRAINT IF EXISTS recurring_transactions_status_check;

ALTER TABLE recurring_transactions
  ADD CONSTRAINT recurring_transactions_status_check
  CHECK (status IN ('active', 'cancelled', 'completed', 'dismissed'));
