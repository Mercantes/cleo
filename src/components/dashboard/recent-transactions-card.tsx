'use client';

import Link from 'next/link';
import { formatCurrency, formatTransactionName } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { useApi } from '@/hooks/use-api';
import { CardInfoTip } from './card-info-tip';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'debit' | 'credit';
  merchant: string | null;
  categories: { name: string; icon: string } | null;
}

interface RecentData {
  transactions: Transaction[];
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  Alimentação: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  Transporte: 'bg-red-500/15 text-red-600 dark:text-red-400',
  Moradia: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Saúde: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  Educação: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  Lazer: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  Serviços: 'bg-green-500/15 text-green-600 dark:text-green-400',
  Transferências: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  Supermercado: 'bg-lime-500/15 text-lime-600 dark:text-lime-400',
  Restaurantes: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  Investimentos: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Estacionamento: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'Serviços digitais': 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
};

function getDateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - txDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'HOJE';
  if (diffDays === 1) return 'ONTEM';
  return date.toLocaleDateString('pt-BR', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const label = getDateGroupLabel(tx.date);
    const existing = groups.get(label) || [];
    existing.push(tx);
    groups.set(label, existing);
  }
  return groups;
}

function getCategoryBadgeColor(name: string): string {
  return CATEGORY_BADGE_COLORS[name] || 'bg-muted text-muted-foreground';
}

export function RecentTransactionsCard() {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const { data, isLoading } = useApi<RecentData>('/api/dashboard/recent');

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  const allTransactions = data?.transactions || [];
  const transactions = allTransactions.slice(0, 8);

  if (isLoading) {
    return <div className="h-[220px] animate-pulse rounded-lg border bg-muted sm:h-[300px]" />;
  }

  if (allTransactions.length === 0) return null;

  const grouped = groupByDate(transactions);

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Transações Recentes</p>
          <CardInfoTip text="Últimas movimentações nas suas contas bancárias, incluindo despesas e receitas." />
        </span>
        <Link href={`/transactions?from=${monthStart}&to=${monthEnd}`} className="text-xs font-medium text-primary hover:underline">
          Ver todas ↗
        </Link>
      </div>
      {transactions.length > 0 && (() => {
        const debits = transactions.filter(t => t.type === 'debit');
        const credits = transactions.filter(t => t.type === 'credit');
        return (
          <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
            {debits.length} despesa{debits.length !== 1 ? 's' : ''}
            {credits.length > 0 && ` · ${credits.length} receita${credits.length !== 1 ? 's' : ''}`}
          </p>
        );
      })()}

      <div className="mt-3 space-y-4">
        {Array.from(grouped.entries()).map(([dateLabel, txs]) => (
          <div key={dateLabel}>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                {dateLabel}
              </p>
              <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                {hideValues ? HIDDEN_VALUE : formatCurrency(txs.reduce((s, t) => s + (t.type === 'credit' ? t.amount : -t.amount), 0))}
              </span>
            </div>
            <div className="space-y-0.5">
              {txs.map((tx) => {
                const isIncome = tx.type === 'credit';
                const categoryName = tx.categories?.name || 'Sem categoria';
                const displayName = formatTransactionName(tx.description, tx.merchant);

                return (
                  <Link
                    key={tx.id}
                    href={`/transactions?search=${encodeURIComponent(displayName)}`}
                    className="flex items-center justify-between gap-2 rounded-md px-1 py-2.5 transition-colors hover:bg-accent/50 sm:py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {displayName}
                      </p>
                    </div>

                    <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-block sm:shrink-0 ${getCategoryBadgeColor(categoryName)}`}>
                      {tx.categories?.icon ? `${tx.categories.icon} ` : ''}{categoryName}
                    </span>

                    <span className={`shrink-0 text-sm font-medium tabular-nums ${isIncome ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {isIncome ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
