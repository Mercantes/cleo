'use client';

import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { formatCurrency, formatTransactionName } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import type { RecurringItem } from '@/types/dashboard';

interface RecurringData {
  subscriptions: RecurringItem[];
  installments: RecurringItem[];
  monthlyTotal: number;
}

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const future = new Date(today);
  future.setDate(future.getDate() + days);
  return txDay >= today && txDay <= future;
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function UpcomingExpensesCard() {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const { data } = useApi<RecurringData>('/api/recurring');

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  if (!data) {
    return (
      <div className="flex h-full flex-col rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-3 space-y-1">
          <div className="mb-2 h-7 w-full animate-pulse rounded-md bg-muted" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2 px-1 py-2">
              <div className="space-y-1 flex-1">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allItems = [...data.subscriptions, ...data.installments];
  const upcoming = allItems
    .filter((item) => item.next_expected_date && isWithinDays(item.next_expected_date, 14))
    .sort((a, b) => new Date(a.next_expected_date).getTime() - new Date(b.next_expected_date).getTime());

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Próximas Despesas</p>
        <Link href={`/transactions?type=debit&from=${monthStart}&to=${monthEnd}`} className="text-xs font-medium text-primary hover:underline">
          Ver todas ↗
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
          <CalendarClock className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Nenhum pagamento recorrente nos próximos 14 dias
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-1">
          <div className="mb-2 flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5 text-xs">
            <span className="text-muted-foreground">{upcoming.length} pagamento{upcoming.length !== 1 ? 's' : ''} próximo{upcoming.length !== 1 ? 's' : ''}</span>
            <span className="font-semibold">{fmt(upcoming.reduce((s, i) => s + Math.abs(i.amount), 0))}</span>
          </div>
          {upcoming.map((item, i) => (
            <div
              key={`${item.merchant}-${i}`}
              className="flex items-center justify-between gap-2 rounded-md px-1 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{formatTransactionName(item.merchant, null)}</p>
                <p className={cn(
                  'text-xs',
                  isWithinDays(item.next_expected_date, 2) ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                )}>
                  {formatDueDate(item.next_expected_date)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {fmt(Math.abs(item.amount))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
