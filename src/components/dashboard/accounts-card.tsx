'use client';

import Link from 'next/link';
import { Landmark, ChevronRight, RefreshCw, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
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
  bankTotal: number;
  creditTotal: number;
  lastSyncAt: string | null;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH}h`;
  if (diffD === 1) return 'ontem';
  if (diffD < 7) return `há ${diffD} dias`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const TYPE_LABELS: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  credit: 'Cartão de Crédito',
};

export function AccountsCard() {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
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
          href="/accounts"
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
            <div className="text-right">
              <span
                className={cn(
                  'text-sm font-semibold',
                  acc.balance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-500 dark:text-red-400',
                )}
              >
                {fmt(acc.balance)}
              </span>
              {totalBalance !== 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {Math.round((acc.balance / totalBalance) * 100)}%
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5 border-t pt-3">
        {(data?.bankTotal ?? 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Landmark className="h-3 w-3" />
              Saldo em contas
            </span>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              {fmt(data?.bankTotal ?? 0)}
            </span>
          </div>
        )}
        {(data?.creditTotal ?? 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CreditCard className="h-3 w-3" />
              Faturas cartões
            </span>
            <span className="text-xs font-semibold text-red-500 dark:text-red-400">
              -{fmt(data?.creditTotal ?? 0)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between border-t pt-1.5">
          <span className="text-sm font-medium text-muted-foreground">Patrimônio total</span>
          <span
            className={cn(
              'text-base font-bold',
              totalBalance >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-500 dark:text-red-400',
            )}
          >
            {fmt(totalBalance)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {accounts.length} conta{accounts.length !== 1 ? 's' : ''} conectada{accounts.length !== 1 ? 's' : ''}
          </p>
          {data?.lastSyncAt && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground" title={`Última sincronização: ${new Date(data.lastSyncAt).toLocaleString('pt-BR')}`}>
              <RefreshCw className="h-2.5 w-2.5" />
              {formatRelativeTime(data.lastSyncAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
