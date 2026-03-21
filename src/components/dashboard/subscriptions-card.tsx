'use client';

import { Repeat } from 'lucide-react';
import { formatCurrency, formatTransactionName } from '@/lib/utils/format';
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

  if (!data) return null;

  if (data.subscriptions.length === 0 && data.installments.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Compromissos Recorrentes</p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Nenhuma assinatura ou parcela detectada ainda. Transações recorrentes aparecerão aqui automaticamente.
        </p>
      </div>
    );
  }

  const total = data.subscriptions.length + data.installments.length;
  const topItems = [...data.subscriptions, ...data.installments]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 3);

  return (
    <Link href="/subscriptions" className="flex h-full flex-col rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Compromissos Recorrentes</p>
        </div>
        <span className="text-xs text-muted-foreground">{total} ativo{total > 1 ? 's' : ''}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-lg font-bold">{fmt(data.monthlyTotal)}/mês</p>
        <span className="text-xs text-muted-foreground">{fmt(data.monthlyTotal * 12)}/ano</span>
      </div>
      {data.installments.length > 0 && (() => {
        const ending = data.installments.filter(i => i.installments_remaining != null && i.installments_remaining <= 2);
        if (ending.length === 0) return null;
        return (
          <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
            {ending.length} parcela{ending.length > 1 ? 's' : ''} acabando em breve
          </p>
        );
      })()}

      {topItems.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t pt-3">
          <p className="text-[10px] text-muted-foreground">Maiores compromissos</p>
          {topItems.map((item) => {
            const typeLabel = item.type === 'installment' ? 'Parcela' : item.type === 'income' ? 'Receita' : 'Assinatura';
            const typeColor = item.type === 'installment'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
              : item.type === 'income'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
            return (
              <div key={item.merchant} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 truncate text-muted-foreground">
                  {formatTransactionName(item.merchant, null)}
                  <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-medium ${typeColor}`}>
                    {typeLabel}
                  </span>
                  {item.installments_remaining != null && (
                    <span className="shrink-0 text-amber-600 dark:text-amber-400">
                      ({item.installments_remaining}x)
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-medium">{fmt(Math.abs(item.amount))}</span>
              </div>
            );
          })}
          {total > 3 && (
            <p className="text-[10px] text-muted-foreground">+{total - 3} mais</p>
          )}
        </div>
      )}
    </Link>
  );
}
