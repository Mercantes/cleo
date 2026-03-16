-- Allow 'income' type in recurring_transactions for recurring income detection
ALTER TABLE recurring_transactions
  DROP CONSTRAINT IF EXISTS recurring_transactions_type_check;

ALTER TABLE recurring_transactions
  ADD CONSTRAINT recurring_transactions_type_check
  CHECK (type IN ('subscription', 'installment', 'income'));

-- Also update user_override to accept 'income'
ALTER TABLE recurring_transactions
  DROP CONSTRAINT IF EXISTS recurring_transactions_user_override_check;

ALTER TABLE recurring_transactions
  ADD CONSTRAINT recurring_transactions_user_override_check
  CHECK (user_override IN ('subscription', 'installment', 'income'));
