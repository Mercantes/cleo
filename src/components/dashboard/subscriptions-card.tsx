'use client';

import { Repeat } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { RecurringItem } from '@/types/dashboard';

interface RecurringData {
  subscriptions: RecurringItem[];
  installments: RecurringItem[];
  monthlyTotal: number;
}

export function SubscriptionsCard() {
  const { data } = useApi<RecurringData>('/api/recurring');

  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  if (!data || (data.subscriptions.length === 0 && data.installments.length === 0)) {
    return null;
  }

  const total = data.subscriptions.length + data.installments.length;
  const topItems = [...data.subscriptions, ...data.installments]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 3);

  return (
    <Link href="/subscriptions" className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Compromissos Recorrentes</p>
        </div>
        <span className="text-xs text-muted-foreground">{total} ativo{total > 1 ? 's' : ''}</span>
      </div>
      <p className="mt-1 text-lg font-bold">{fmt(data.monthlyTotal)}/mês</p>

      {topItems.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t pt-3">
          {topItems.map((item) => (
            <div key={item.merchant} className="flex items-center justify-between text-xs">
              <span className="truncate text-muted-foreground">
                {item.merchant}
                {item.installments_remaining != null && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    ({item.installments_remaining}x)
                  </span>
                )}
              </span>
              <span className="shrink-0 font-medium">{fmt(Math.abs(item.amount))}</span>
            </div>
          ))}
          {total > 3 && (
            <p className="text-[10px] text-muted-foreground">+{total - 3} mais</p>
          )}
        </div>
      )}
    </Link>
  );
}
