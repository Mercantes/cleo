'use client';

import { memo } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface SummaryData {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  percentChange: number;
}

export const SummaryCards = memo(function SummaryCards({ data }: { data: SummaryData }) {
  const cards = [
    {
      label: 'Receita',
      value: formatCurrency(data.income),
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Despesas',
      value: formatCurrency(data.expenses),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Saldo',
      value: formatCurrency(data.balance),
      icon: Wallet,
      color: data.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Taxa de poupança',
      value: `${data.savingsRate}%`,
      icon: PiggyBank,
      color: data.savingsRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <p className={`mt-1 text-lg font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
      {data.percentChange !== 0 && (
        <div className="col-span-2 rounded-lg border bg-card p-3 lg:col-span-4">
          <p className="text-sm text-muted-foreground">
            {data.percentChange > 0
              ? `Você gastou ${data.percentChange}% a mais que o mês anterior`
              : `Você gastou ${Math.abs(data.percentChange)}% a menos que o mês anterior`}
          </p>
        </div>
      )}
    </div>
  );
});
