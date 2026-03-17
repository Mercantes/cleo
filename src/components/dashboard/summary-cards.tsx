'use client';

import { memo } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';

interface SummaryData {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  percentChange: number;
  month?: string;
}

export const SummaryCards = memo(function SummaryCards({ data }: { data: SummaryData }) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const cards = [
    {
      label: 'Receita',
      value: fmt(data.income),
      sub: undefined as string | undefined,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      href: '/transactions?type=credit',
    },
    {
      label: 'Despesas',
      value: fmt(data.expenses),
      sub: (() => {
        const now2 = new Date();
        const day = now2.getDate();
        return day >= 2 ? `${fmt(Math.round(data.expenses / day))}/dia` : undefined;
      })(),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      href: '/transactions?type=debit',
    },
    {
      label: 'Saldo',
      value: fmt(data.balance),
      sub: undefined as string | undefined,
      icon: Wallet,
      color: data.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      href: '/transactions',
    },
    {
      label: 'Taxa de poupança',
      value: hideValues ? '••%' : `${data.savingsRate}%`,
      sub: data.savingsRate >= 20 ? 'Excelente' : data.savingsRate >= 10 ? 'Boa' : data.savingsRate > 0 ? 'Baixa' : data.savingsRate === 0 ? undefined : 'Negativa',
      icon: PiggyBank,
      color: data.savingsRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      href: '/projections',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          aria-label={`${card.label}: ${card.value}`}
          className="rounded-lg border bg-card p-4 transition-all duration-200 hover:bg-accent/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <p className={`mt-1 text-lg font-bold ${card.color}`}>{card.value}</p>
          {'sub' in card && card.sub && (
            <p className="text-[10px] text-muted-foreground">{card.sub}</p>
          )}
        </Link>
      ))}
      {data.percentChange !== 0 && (() => {
        const isOver = data.percentChange > 0;
        const now = new Date();
        const isCurrentMonth = !data.month || data.month === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthProgress = isCurrentMonth ? Math.round((dayOfMonth / daysInMonth) * 100) : 100;
        // How much of last month's expenses we've already spent
        const lastMonthExpenses = data.expenses / (1 + data.percentChange / 100);
        const budgetUsed = lastMonthExpenses > 0 ? Math.min(Math.round((data.expenses / lastMonthExpenses) * 100), 150) : 0;

        return (
          <div className={`col-span-2 rounded-lg border p-3 lg:col-span-4 ${
            isOver
              ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
              : 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <span className="mr-1">{isOver ? '📈' : '📉'}</span>
                {isOver
                  ? `Você gastou ${data.percentChange}% a mais que o mês anterior`
                  : `Você gastou ${Math.abs(data.percentChange)}% a menos que o mês anterior`}
              </p>
              {isCurrentMonth && (
                <span className="text-xs text-muted-foreground">
                  Dia {dayOfMonth}/{daysInMonth}
                </span>
              )}
            </div>
            {isCurrentMonth && lastMonthExpenses > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Orçamento vs mês anterior</span>
                  <span className={budgetUsed > 100 ? 'font-medium text-red-600 dark:text-red-400' : ''}>
                    {budgetUsed}%
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budgetUsed > 100
                        ? 'bg-red-500'
                        : budgetUsed > monthProgress
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                  />
                  {/* Month progress marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-foreground/30"
                    style={{ left: `${monthProgress}%` }}
                    title={`${monthProgress}% do mês`}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {budgetUsed <= monthProgress
                    ? 'Dentro do ritmo esperado para o mês'
                    : budgetUsed <= 100
                      ? 'Um pouco acima do ritmo, mas dentro do orçamento'
                      : `${fmt(data.expenses - lastMonthExpenses)} acima do mês anterior`}
                </p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
});
