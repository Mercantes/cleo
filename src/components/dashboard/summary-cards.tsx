'use client';

import { memo } from 'react';
import Link from 'next/link';
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
      href: '/transactions',
    },
    {
      label: 'Despesas',
      value: formatCurrency(data.expenses),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      href: '/transactions',
    },
    {
      label: 'Saldo',
      value: formatCurrency(data.balance),
      icon: Wallet,
      color: data.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      href: '/transactions',
    },
    {
      label: 'Taxa de poupança',
      value: `${data.savingsRate}%`,
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
          className="rounded-lg border bg-card p-4 transition-all duration-200 hover:bg-accent/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <p className={`mt-1 text-lg font-bold ${card.color}`}>{card.value}</p>
        </Link>
      ))}
      {data.percentChange !== 0 && (
        <div className={`col-span-2 rounded-lg border p-3 lg:col-span-4 ${
          data.percentChange > 0
            ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
            : 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
        }`}>
          <p className="text-sm">
            <span className="mr-1">{data.percentChange > 0 ? '📈' : '📉'}</span>
            {data.percentChange > 0
              ? `Você gastou ${data.percentChange}% a mais que o mês anterior`
              : `Você gastou ${Math.abs(data.percentChange)}% a menos que o mês anterior`}
          </p>
        </div>
      )}
    </div>
  );
});
