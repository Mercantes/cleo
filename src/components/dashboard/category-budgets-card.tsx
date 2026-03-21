'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import type { BudgetItem } from '@/types/dashboard';

export function CategoryBudgetsCard() {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const { data: budgetsData, isLoading: loading } = useApi<{ budgets: BudgetItem[] }>('/api/budgets');
  const budgets = budgetsData?.budgets || [];

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  if (loading) {
    return (
      <div className="flex h-full flex-col rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
              <div className="mt-1.5 h-1.5 w-full animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Limites por Categoria</h3>
          <Link
            href="/settings?tab=goals"
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Configurar
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Defina limites mensais por categoria para controlar seus gastos.
        </p>
      </div>
    );
  }

  const alerts = budgets.filter((b) => b.status !== 'ok');

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Limites por Categoria</h3>
        <Link
          href="/settings?tab=goals"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Editar
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {alerts.length > 0 && (
        <div className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 dark:bg-amber-950/50">
          <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {alerts.length} {alerts.length === 1 ? 'categoria acima' : 'categorias acima'} do limite
          </p>
        </div>
      )}

      <div className="mt-3 space-y-2.5">
        {budgets.map((b) => (
          <Link
            key={b.id}
            href={`/transactions?category=${encodeURIComponent(b.categoryId)}&from=${monthStart}&to=${monthEnd}`}
            className="block rounded-md px-1 py-1.5 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span>{b.categoryIcon}</span>
                <span className="font-medium">{b.categoryName}</span>
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span>{fmt(b.spent)} / {fmt(b.monthlyLimit)}</span>
                <span className={cn(
                  'text-[11px] font-medium',
                  b.status === 'over' ? 'text-red-500' : b.status === 'warning' ? 'text-amber-600' : 'text-green-600 dark:text-green-400',
                )}>
                  {b.percentage}%
                </span>
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    b.status === 'over' ? 'bg-red-500' : b.status === 'warning' ? 'bg-amber-500' : 'bg-green-500',
                  )}
                  style={{ width: `${Math.min(b.percentage, 100)}%` }}
                />
              </div>
              {b.status === 'over' ? (
                <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />
              ) : b.status === 'ok' ? (
                <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
              ) : null}
            </div>
            {b.status === 'ok' && b.monthlyLimit > b.spent && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Restam {fmt(b.monthlyLimit - b.spent)}
              </p>
            )}
            {b.status === 'over' && (
              <p className="mt-0.5 text-[11px] text-red-500">
                {fmt(b.spent - b.monthlyLimit)} acima
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
