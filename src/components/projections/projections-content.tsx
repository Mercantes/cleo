'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { ProjectionCards, ProjectionCardsSkeleton } from './projection-cards';
import { SpendingForecast } from '@/components/dashboard/spending-forecast';

const ProjectionChart = dynamic(() => import('./projection-chart').then((m) => m.ProjectionChart), {
  ssr: false,
  loading: () => <div className="h-[350px] animate-pulse rounded-lg border bg-muted" />,
});
import type { ProjectionResult } from '@/lib/finance/projection-engine';

export function ProjectionsContent() {
  const [data, setData] = useState<ProjectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('realistic');
  const [horizon, setHorizon] = useState<number | null>(null);

  const handleScenarioChange = useCallback((scenario: string) => {
    setActiveScenario(scenario);
  }, []);

  const handleHorizonChange = useCallback((months: number | null) => {
    setHorizon((prev) => prev === months ? null : months);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/projections')
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const retry = () => {
    setLoading(true);
    setError(false);
    fetch('/api/projections')
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-[300px] animate-pulse rounded-lg bg-muted" />
        <ProjectionCardsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Erro ao carregar projeções"
        description="Não foi possível calcular suas projeções. Tente novamente."
        action={{ label: 'Tentar novamente', onClick: retry }}
      />
    );
  }

  if (!data || !data.hasEnoughData) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Dados insuficientes"
        description="Precisamos de pelo menos 2 meses de transações para calcular suas projeções financeiras. Continue usando a Cleo!"
      />
    );
  }

  const savingsRate = data.savingsRate * 100;
  const monthsToEmergency = (() => {
    if (!data.scenarios || data.avgExpenses <= 0) return null;
    const realistic = data.scenarios.find(s => s.label === 'realistic');
    if (!realistic || realistic.monthlySavings <= 0) return null;
    const emergencyTarget = data.avgExpenses * 6;
    if (data.currentBalance >= emergencyTarget) return 0;
    return Math.ceil((emergencyTarget - data.currentBalance) / realistic.monthlySavings);
  })();
  const tipText = savingsRate >= 20
    ? 'Excelente! Com essa taxa de economia, seu patrimônio cresce de forma saudável.'
    : savingsRate >= 10
    ? 'Bom progresso! Tente aumentar para 20% para acelerar seus objetivos.'
    : savingsRate > 0
    ? 'Sua taxa de economia está baixa. Pequenos cortes podem fazer grande diferença ao longo do tempo.'
    : 'Você está gastando mais do que ganha. Revise seus gastos para inverter essa tendência.';

  return (
    <div className="space-y-6">
      {/* Contextual tip */}
      <div className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm',
        savingsRate >= 20 ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30' :
        savingsRate >= 10 ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' :
        'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
      )}>
        <TrendingUp className={cn('h-5 w-5 shrink-0',
          savingsRate >= 20 ? 'text-green-600 dark:text-green-400' :
          savingsRate >= 10 ? 'text-amber-600 dark:text-amber-400' :
          'text-red-500 dark:text-red-400',
        )} />
        <p className="text-muted-foreground">{tipText}</p>
        {monthsToEmergency !== null && monthsToEmergency > 0 && (
          <p className="ml-8 mt-1 text-xs text-muted-foreground">
            ~{monthsToEmergency} {monthsToEmergency === 1 ? 'mês' : 'meses'} para reserva de emergência (6x despesas)
          </p>
        )}
        {monthsToEmergency === 0 && (
          <p className="ml-8 mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
            Reserva de emergência atingida!
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <ProjectionChart scenarios={data.scenarios} activeScenario={activeScenario} onScenarioChange={handleScenarioChange} horizon={horizon} />
        </div>
        <div className="w-full lg:w-64">
          <ProjectionCards data={data} activeScenario={activeScenario} onScenarioChange={handleScenarioChange} selectedHorizon={horizon} onHorizonChange={handleHorizonChange} />
        </div>
      </div>
      <SpendingForecast />
    </div>
  );
}
