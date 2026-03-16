'use client';

import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { formatCurrency } from '@/lib/utils/format';

interface CurrencyValueProps {
  amount: number;
  className?: string;
}

export function CurrencyValue({ amount, className }: CurrencyValueProps) {
  const [hidden] = useHideValues();

  return (
    <span className={className}>
      {hidden ? HIDDEN_VALUE : formatCurrency(amount)}
    </span>
  );
}
