'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ProjectionChart } from './projection-chart';
import { ProjectionCards, ProjectionCardsSkeleton } from './projection-cards';
import type { ProjectionResult } from '@/lib/finance/projection-engine';

export function ProjectionsContent() {
  const [data, setData] = useState<ProjectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1">
        <ProjectionChart scenarios={data.scenarios} />
      </div>
      <div className="w-full lg:w-64">
        <ProjectionCards data={data} />
      </div>
    </div>
  );
}
