import { cn } from '@/lib/utils';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';

interface TransactionItemProps {
  description: string;
  amount: number;
  date: string;
  type: 'debit' | 'credit';
  category?: {
    name: string;
    icon: string;
  } | null;
  merchant?: string | null;
}

export function TransactionItem({
  description,
  amount,
  date,
  type,
  category,
  merchant,
}: TransactionItemProps) {
  const displayAmount = type === 'credit' ? amount : -amount;
  const isIncome = type === 'credit';

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3 md:p-4">
      <div className="flex items-center gap-3">
        <span className="text-xl" role="img" aria-label={category?.name || 'Sem categoria'}>
          {category?.icon || '📦'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{merchant || description}</p>
          <p className="text-xs text-muted-foreground">
            {category?.name || 'Sem categoria'} · {formatRelativeDate(date)}
          </p>
        </div>
      </div>
      <span
        className={cn(
          'shrink-0 text-sm font-semibold',
          isIncome ? 'text-green-600' : 'text-foreground',
        )}
      >
        {isIncome ? '+' : ''}{formatCurrency(displayAmount)}
      </span>
    </div>
  );
}
