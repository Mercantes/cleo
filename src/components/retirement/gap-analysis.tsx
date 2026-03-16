'use client';

import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import type { RetirementResult } from '@/lib/finance/retirement-engine';

interface GapAnalysisProps {
  data: RetirementResult;
}

export function GapAnalysis({ data }: GapAnalysisProps) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const isOnTrack = data.gap <= 0;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs text-muted-foreground">Tempo para independência financeira</p>
        <p className="text-2xl font-bold">
          {data.yearsToFI >= 0 ? `${data.yearsToFI} anos` : '50+ anos'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Meta FIRE: {fmt(data.fiNumber)}
        </p>
      </div>

      <div className={`rounded-lg border p-4 ${isOnTrack ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'}`}>
        <p className="text-xs text-muted-foreground">
          {isOnTrack ? 'Você está no caminho certo!' : 'Gap mensal'}
        </p>
        <p className="text-lg font-semibold">
          {isOnTrack ? 'Economia suficiente' : `${fmt(Math.abs(data.gap))} a mais/mês`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Necessário: {fmt(Math.max(0, data.requiredMonthlySavings))}/mês para aposentar em 20 anos
        </p>
      </div>

      {data.scenarios.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Cenários</p>
          <div className="space-y-2">
            {data.scenarios.map((s) => (
              <div key={s.extraMonthly} className="flex items-center justify-between text-sm">
                <span>+{fmt(s.extraMonthly)}/mês</span>
                <span className="text-green-600 dark:text-green-400">
                  {s.yearsSaved > 0 ? `${s.yearsSaved} anos antes` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
