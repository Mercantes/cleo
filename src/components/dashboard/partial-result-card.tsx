'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import type { SummaryData } from '@/types/dashboard';

interface PartialResultCardProps {
  data: SummaryData;
}

export function PartialResultCard({ data }: PartialResultCardProps) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const { income, expenses, balance } = data;
  const total = income + expenses;
  const incomePct = total > 0 ? (income / total) * 100 : 50;

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resultado Parcial</p>
        <Link href="/cashflow" className="text-xs font-medium text-primary hover:underline">
          Fluxo de caixa ↗
        </Link>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {fmt(balance)}
        </span>
      </div>

      {data.percentChange !== 0 && (
        <div className="mt-1 flex items-center gap-2">
          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${
            data.percentChange > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
          }`}>
            {data.percentChange > 0 ? '+' : ''}{data.percentChange}%
          </span>
          <span className="text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      )}

      {/* Progress bar: income (green) vs expenses (red) */}
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full">
        <div className="bg-green-500 transition-all" style={{ width: `${incomePct}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${100 - incomePct}%` }} />
      </div>

      {/* Breakdown */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Receita</p>
          <p className="mt-0.5 text-sm font-bold text-green-600 dark:text-green-400">{fmt(income)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Gasto</p>
          <p className="mt-0.5 text-sm font-bold text-red-500 dark:text-red-400">{fmt(expenses)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Poupança</p>
          <p className="mt-0.5 text-sm font-bold">{data.savingsRate}%</p>
        </div>
      </div>
    </div>
  );
}
