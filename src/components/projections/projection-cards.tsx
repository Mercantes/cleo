'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import type { ProjectionResult, ProjectionScenario } from '@/lib/finance/projection-engine';

interface ProjectionCardsProps {
  data: ProjectionResult;
}

const scenarioLabels: Record<string, { name: string; description: string }> = {
  optimistic: { name: 'Otimista', description: '+10% economia' },
  realistic: { name: 'Realista', description: 'Média atual' },
  pessimistic: { name: 'Pessimista', description: '-10% economia' },
};

export function ProjectionCards({ data }: ProjectionCardsProps) {
  const [selectedLabel, setSelectedLabel] = useState<string>('realistic');
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const scenario = data.scenarios.find((s) => s.label === selectedLabel) as ProjectionScenario | undefined;
  if (!scenario) return null;

  const horizons = [
    { label: '3 meses', index: 2 },
    { label: '6 meses', index: 5 },
    { label: '12 meses', index: 11 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        {data.scenarios.map((s) => {
          const info = scenarioLabels[s.label];
          return (
            <button
              key={s.label}
              onClick={() => setSelectedLabel(s.label)}
              className={cn(
                'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                selectedLabel === s.label
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {info?.name || s.label}
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {scenarioLabels[selectedLabel]?.description}
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        {horizons.map((h) => (
          <div key={h.label} className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">{h.label}</p>
            <p className="text-lg font-semibold">
              {fmt(scenario.monthlyData[h.index]?.balance ?? 0)}
            </p>
          </div>
        ))}
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Economia mensal</p>
          <p className="text-lg font-semibold">{fmt(scenario.monthlySavings)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Taxa de poupança</p>
          <p className="text-lg font-semibold">{(data.savingsRate * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Saldo atual</p>
          <p className="text-lg font-semibold">{fmt(data.currentBalance)}</p>
        </div>
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
