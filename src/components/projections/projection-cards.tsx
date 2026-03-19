'use client';

import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import type { ProjectionResult, ProjectionScenario } from '@/lib/finance/projection-engine';

interface ProjectionCardsProps {
  data: ProjectionResult;
  activeScenario: string;
  onScenarioChange: (scenario: string) => void;
  selectedHorizon: number | null;
  onHorizonChange: (months: number | null) => void;
}

const scenarioLabels: Record<string, { name: string; description: string }> = {
  optimistic: { name: 'Otimista', description: '+10% economia' },
  realistic: { name: 'Realista', description: 'Média atual' },
  pessimistic: { name: 'Pessimista', description: '-10% economia' },
};

export function ProjectionCards({ data, activeScenario, onScenarioChange, selectedHorizon, onHorizonChange }: ProjectionCardsProps) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const scenario = data.scenarios.find((s) => s.label === activeScenario) as ProjectionScenario | undefined;
  if (!scenario) return null;

  const horizons = [
    { label: '3 meses', months: 3, index: 2 },
    { label: '6 meses', months: 6, index: 5 },
    { label: '12 meses', months: 12, index: 11 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        {data.scenarios.map((s) => {
          const info = scenarioLabels[s.label];
          return (
            <button
              key={s.label}
              onClick={() => onScenarioChange(s.label)}
              className={cn(
                'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                activeScenario === s.label
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
        {scenarioLabels[activeScenario]?.description}
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        {horizons.map((h) => {
          const projectedBalance = scenario.monthlyData[h.index]?.balance ?? 0;
          const growth = projectedBalance - data.currentBalance;
          return (
            <button
              key={h.label}
              onClick={() => onHorizonChange(h.months)}
              className={cn(
                'rounded-lg border bg-card p-3 text-left transition-colors',
                selectedHorizon === h.months
                  ? 'border-primary ring-1 ring-primary'
                  : 'hover:border-muted-foreground/40',
              )}
            >
              <p className="text-xs text-muted-foreground">{h.label}</p>
              <p className="text-lg font-semibold">
                {fmt(projectedBalance)}
              </p>
              {data.currentBalance > 0 && growth !== 0 && (
                <p className={cn('text-[10px]', growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                  {growth >= 0 ? '+' : ''}{fmt(growth)}
                </p>
              )}
            </button>
          );
        })}
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Economia mensal</p>
          <p className="text-lg font-semibold">{fmt(scenario.monthlySavings)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Taxa de poupança</p>
          <p className={cn('text-lg font-semibold', data.savingsRate >= 0.2 ? 'text-green-600 dark:text-green-400' : data.savingsRate >= 0.1 ? 'text-amber-600' : data.savingsRate > 0 ? 'text-red-500' : 'text-red-600')}>
            {(data.savingsRate * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            {data.savingsRate >= 0.2 ? 'Excelente' : data.savingsRate >= 0.1 ? 'Bom' : data.savingsRate > 0 ? 'Baixa' : 'Negativa'}
          </p>
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
