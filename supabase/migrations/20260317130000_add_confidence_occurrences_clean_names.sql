-- Add confidence and occurrences columns for UI display
ALTER TABLE recurring_transactions
  ADD COLUMN IF NOT EXISTS confidence text NOT NULL DEFAULT 'medium'
  CHECK (confidence IN ('high', 'medium', 'low'));

ALTER TABLE recurring_transactions
  ADD COLUMN IF NOT EXISTS occurrences integer NOT NULL DEFAULT 1;

-- Clean existing merchant names: remove transaction type prefixes
UPDATE recurring_transactions
SET merchant = TRIM(
  REGEXP_REPLACE(
    merchant,
    '^(Transferência Recebida|Transferencia Recebida|Pagamento recebido|Compra no débito|Compra no debito)\|?',
    '',
    'i'
  )
)
WHERE merchant ~* '^(Transferência Recebida|Transferencia Recebida|Pagamento recebido|Compra no débito|Compra no debito)';
