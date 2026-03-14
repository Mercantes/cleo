'use client';

import Link from 'next/link';
import { Landmark, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  bankName: string;
}

interface AccountsData {
  accounts: Account[];
  totalBalance: number;
}

const TYPE_LABELS: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  credit: 'Cartão de Crédito',
};

export function AccountsCard() {
  const { data, isLoading } = useApi<AccountsData>('/api/dashboard/accounts');

  const accounts = data?.accounts || [];
  const totalBalance = data?.totalBalance || 0;

  if (isLoading) {
    return <div className="h-[180px] animate-pulse rounded-lg border bg-muted" />;
  }

  if (accounts.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Contas Bancárias</h3>
        <Link
          href="/settings"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Gerenciar
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center justify-between rounded-md px-2 py-1.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">{acc.name}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABELS[acc.type] || acc.type}</p>
              </div>
            </div>
            <span
              className={cn(
                'text-sm font-semibold',
                acc.balance >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400',
              )}
            >
              {formatCurrency(acc.balance)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-sm font-medium text-muted-foreground">Patrimônio total</span>
        <span
          className={cn(
            'text-base font-bold',
            totalBalance >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-500 dark:text-red-400',
          )}
        >
          {formatCurrency(totalBalance)}
        </span>
      </div>
    </div>
  );
}
