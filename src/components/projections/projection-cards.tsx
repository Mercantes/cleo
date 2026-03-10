'use client';

import { formatCurrency } from '@/lib/utils/format';
import type { ProjectionResult } from '@/lib/finance/projection-engine';

interface ProjectionCardsProps {
  data: ProjectionResult;
}

export function ProjectionCards({ data }: ProjectionCardsProps) {
  const realistic = data.scenarios.find((s) => s.label === 'realistic');
  if (!realistic) return null;

  const horizons = [
    { label: '3 meses', index: 2 },
    { label: '6 meses', index: 5 },
    { label: '12 meses', index: 11 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
      {horizons.map((h) => (
        <div key={h.label} className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">{h.label}</p>
          <p className="text-lg font-semibold">
            {formatCurrency(realistic.monthlyData[h.index]?.balance ?? 0)}
          </p>
        </div>
      ))}
      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs text-muted-foreground">Economia mensal</p>
        <p className="text-lg font-semibold">{formatCurrency(realistic.monthlySavings)}</p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs text-muted-foreground">Taxa de poupança</p>
        <p className="text-lg font-semibold">{(data.savingsRate * 100).toFixed(1)}%</p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs text-muted-foreground">Saldo atual</p>
        <p className="text-lg font-semibold">{formatCurrency(data.currentBalance)}</p>
      </div>
    </div>
  );
}

export function ProjectionCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-3">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-6 w-24 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
