'use client';

import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
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
  const future = new Date(now);
  future.setDate(future.getDate() + days);
  return date >= now && date <= future;
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

  if (!data) return null;

  const allItems = [...data.subscriptions, ...data.installments];
  const upcoming = allItems
    .filter((item) => item.next_expected_date && isWithinDays(item.next_expected_date, 14))
    .sort((a, b) => new Date(a.next_expected_date).getTime() - new Date(b.next_expected_date).getTime());

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Próximas Despesas</p>
        <Link href="/subscriptions" className="text-xs font-medium text-primary hover:underline">
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
          {upcoming.map((item, i) => (
            <div
              key={`${item.merchant}-${i}`}
              className="flex items-center justify-between gap-2 rounded-md px-1 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.merchant}</p>
                <p className="text-xs text-muted-foreground">{formatDueDate(item.next_expected_date)}</p>
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
