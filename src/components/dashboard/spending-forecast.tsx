'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

interface Prediction {
  category: string;
  avgMonthly: number;
  currentSpending: number;
  projectedSpending: number;
  trend: number;
  status: 'over' | 'under' | 'on_track';
}

export function SpendingForecast() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [monthProgress, setMonthProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetchWithTimeout('/api/projections/categories')
      .then((r) => {
        if (!r.ok) return { predictions: [], hasEnoughData: false, monthProgress: 0 };
        return r.json();
      })
      .then((d) => {
        setPredictions(d.predictions || []);
        setMonthProgress(d.monthProgress || 0);
        setHasData(d.hasEnoughData || false);
      })
      .catch(() => {
        setPredictions([]);
        setHasData(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-[250px] animate-pulse rounded-lg border bg-muted" />;
  }

  if (!hasData || predictions.length === 0) {
    return null;
  }

  const statusColors = {
    over: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
    under: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950',
    on_track: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
  };

  const statusLabels = {
    over: 'Acima',
    under: 'Abaixo',
    on_track: 'Normal',
  };

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Previsão de gastos</h3>
        <span className="text-xs text-muted-foreground">{monthProgress}% do mês</span>
      </div>

      <div className="mt-3 space-y-2">
        {predictions.slice(0, 5).map((p) => (
          <div key={p.category} className="flex items-center justify-between rounded-md border p-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{p.category}</p>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColors[p.status]}`}>
                  {statusLabels[p.status]}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Gasto: {formatCurrency(p.currentSpending)}</span>
                <span>Previsão: {formatCurrency(p.projectedSpending)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {p.trend > 5 ? (
                <TrendingUp className="h-3.5 w-3.5 text-red-500" />
              ) : p.trend < -5 ? (
                <TrendingDown className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={p.trend > 5 ? 'text-red-600 dark:text-red-400' : p.trend < -5 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                {p.trend > 0 ? '+' : ''}{p.trend}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar for month */}
      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary/60 transition-all"
            style={{ width: `${monthProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
