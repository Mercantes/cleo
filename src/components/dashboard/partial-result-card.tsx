'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import type { SummaryData } from '@/types/dashboard';
import { CardInfoTip } from './card-info-tip';

interface PartialResultCardProps {
  data: SummaryData;
}

export function PartialResultCard({ data }: PartialResultCardProps) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const { income, expenses, balance } = data;

  // Bar shows expenses as proportion of income (capped at 100%)
  const expenseRatio = income > 0 ? Math.min((expenses / income) * 100, 100) : 0;
  const savingsRatio = income > 0 ? Math.max(100 - expenseRatio, 0) : 0;
  const overBudget = expenses > income;

  const now = new Date();
  const dayOfMonth = now.getDate();

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resultado do Mês</p>
          <CardInfoTip text="Diferença entre receitas e despesas no mês. Mostra quanto você está poupando ou gastando além da receita." />
        </span>
        <Link href="/cashflow" className="text-xs font-medium text-primary hover:underline">
          Fluxo de caixa ↗
        </Link>
      </div>

      {/* Balance (main number) */}
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {balance >= 0 ? '+' : ''}{fmt(balance)}
        </span>
      </div>

      {/* % change vs last month */}
      {data.percentChange !== 0 && (
        <div className="mt-1 flex items-center gap-2">
          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${
            data.percentChange > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
          }`}>
            {data.percentChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {data.percentChange > 0 ? '+' : ''}{data.percentChange}% nos gastos
          </span>
          <span className="text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      )}

      {/* Income and Expenses breakdown */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-muted-foreground">Receita</span>
          </div>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">{fmt(income)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-red-500 dark:text-red-400" />
            <span className="text-sm text-muted-foreground">Despesas</span>
          </div>
          <span className="text-sm font-bold text-red-500 dark:text-red-400">{fmt(expenses)}</span>
        </div>
      </div>

      {/* Visual bar: how much of income was spent */}
      {income > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{Math.round(expenseRatio)}% da receita gasta</span>
            {savingsRatio > 0 && !overBudget && (
              <span className="text-green-600 dark:text-green-400">{Math.round(savingsRatio)}% poupado</span>
            )}
            {overBudget && (
              <span className="text-red-500">Acima da receita</span>
            )}
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`rounded-l-full transition-all ${overBudget ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${expenseRatio}%` }}
            />
            {savingsRatio > 0 && !overBudget && (
              <div
                className="bg-green-500/30 transition-all"
                style={{ width: `${savingsRatio}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Savings rate badge */}
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">Taxa de poupança</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          data.savingsRate >= 20
            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
            : data.savingsRate >= 10
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : data.savingsRate > 0
                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                : 'bg-red-500/10 text-red-500'
        }`}>
          {data.savingsRate}%
          {data.savingsRate >= 20 ? ' Excelente' : data.savingsRate >= 10 ? ' Boa' : data.savingsRate > 0 ? ' Baixa' : ' Negativa'}
        </span>
      </div>

      {/* Daily averages (only after day 2) */}
      {dayOfMonth >= 2 && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Média diária: <span className="font-medium text-red-500">{fmt(expenses / dayOfMonth)}</span></span>
          <span><span className="font-medium text-green-600 dark:text-green-400">{fmt(income / dayOfMonth)}</span> receita/dia</span>
        </div>
      )}
    </div>
  );
}
