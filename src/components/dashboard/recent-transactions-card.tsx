'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'debit' | 'credit';
  merchant: string | null;
  categories: { name: string; icon: string } | null;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' });
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function RecentTransactionsCard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/recent')
      .then((r) => r.json())
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="h-[300px] animate-pulse rounded-lg border bg-muted" />;
  }

  if (transactions.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Últimas Transações</h3>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver todas
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-1">
        {transactions.map((tx) => {
          const isIncome = tx.type === 'credit';
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full',
                    isIncome ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
                  )}
                >
                  {isIncome ? (
                    <ArrowDownLeft className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">
                    {tx.merchant || tx.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.categories?.name || 'Sem categoria'} · {formatShortDate(tx.date)}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'ml-2 shrink-0 text-sm font-semibold',
                  isIncome
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-500 dark:text-red-400',
                )}
              >
                {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
