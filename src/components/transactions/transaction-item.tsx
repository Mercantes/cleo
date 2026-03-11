'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);
  const displayAmount = type === 'credit' ? amount : -amount;
  const isIncome = type === 'credit';
  const hasMerchantDetail = merchant && merchant !== description;

  return (
    <div
      className="rounded-lg border transition-colors hover:bg-accent/30"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-3 p-3 text-left md:p-4"
        aria-expanded={expanded}
      >
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
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'shrink-0 text-sm font-semibold',
              isIncome ? 'text-green-600 dark:text-green-400' : 'text-foreground',
            )}
          >
            {isIncome ? '+' : ''}{formatCurrency(displayAmount)}
          </span>
          <ChevronDown className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )} />
        </div>
      </button>
      {expanded && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground md:px-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium text-foreground">Descrição</span>
              <p>{description}</p>
            </div>
            {hasMerchantDetail && (
              <div>
                <span className="font-medium text-foreground">Estabelecimento</span>
                <p>{merchant}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Data</span>
              <p>{new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Tipo</span>
              <p>{isIncome ? 'Receita' : 'Despesa'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
