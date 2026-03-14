'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import type { BudgetItem } from '@/types/dashboard';

export function CategoryBudgetsCard() {
  const { data: budgetsData, isLoading: loading } = useApi<{ budgets: BudgetItem[] }>('/api/budgets');
  const budgets = budgetsData?.budgets || [];

  if (loading) {
    return <div className="h-[180px] animate-pulse rounded-lg border bg-muted" />;
  }

  if (budgets.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
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
    <div className="rounded-lg border bg-card p-4">
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
          <div key={b.id}>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span>{b.categoryIcon}</span>
                <span className="font-medium">{b.categoryName}</span>
              </span>
              <span className="text-muted-foreground">
                {formatCurrency(b.spent)} / {formatCurrency(b.monthlyLimit)}
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
          </div>
        ))}
      </div>
    </div>
  );
}
