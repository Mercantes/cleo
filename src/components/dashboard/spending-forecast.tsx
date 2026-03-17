'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { useApi } from '@/hooks/use-api';

interface Prediction {
  category: string;
  avgMonthly: number;
  currentSpending: number;
  projectedSpending: number;
  trend: number;
  status: 'over' | 'under' | 'on_track';
}

interface ForecastData {
  predictions: Prediction[];
  hasEnoughData: boolean;
  monthProgress: number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Alimentação: '🍽️',
  Transporte: '🚗',
  Moradia: '🏠',
  Saúde: '💊',
  Educação: '📚',
  Lazer: '🎮',
  Serviços: '🔧',
  Transferências: '💸',
  Supermercado: '🛒',
  Restaurantes: '🍕',
  Seguros: '🛡️',
  Hospedagem: '🏨',
  Telecomunicações: '📱',
  'Serviços digitais': '💻',
  'Hospital/Labs': '🏥',
  Investimentos: '📈',
  Estacionamento: '🅿️',
  Vestuário: '👕',
  Assinaturas: '📦',
  Outros: '📌',
};

export function SpendingForecast() {
  const { data, isLoading: loading } = useApi<ForecastData>('/api/projections/categories');
  const predictions = data?.predictions || [];
  const monthProgress = data?.monthProgress || 0;
  const hasData = data?.hasEnoughData || false;
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return <div className="h-[250px] animate-pulse rounded-lg border bg-muted" />;
  }

  if (!hasData || predictions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-medium">Previsão de gastos</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          Ainda não há dados suficientes para gerar previsões. Continue registrando suas transações por mais alguns dias.
        </p>
      </div>
    );
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
        {(showAll ? predictions : predictions.slice(0, 5)).map((p) => {
          const spendPct = p.avgMonthly > 0 ? Math.min((p.currentSpending / p.avgMonthly) * 100, 150) : 0;
          const barColor = p.status === 'over' ? 'bg-red-500' : p.status === 'under' ? 'bg-green-500' : 'bg-blue-500';
          return (
            <div key={p.category} className="rounded-md border p-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    <span className="mr-1">{CATEGORY_EMOJI[p.category] || '📌'}</span>
                    {p.category}
                  </p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColors[p.status]}`}>
                    {statusLabels[p.status]}
                  </span>
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
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(spendPct, 100)}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{fmt(p.currentSpending)}</span>
                <span>
                  média {fmt(p.avgMonthly)}
                  {p.status === 'over' && p.avgMonthly > 0 && ` (+${fmt(p.currentSpending - p.avgMonthly)})`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {predictions.length > 5 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 flex w-full items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {showAll ? (
            <>Mostrar menos <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Ver todas ({predictions.length}) <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}

      <div className="mt-3">
        {monthProgress > 0 && monthProgress < 100 && (() => {
          const totalCurrent = predictions.reduce((s, p) => s + p.currentSpending, 0);
          const projected = Math.round(totalCurrent / (monthProgress / 100));
          const totalAvg = predictions.reduce((s, p) => s + p.avgMonthly, 0);
          return (
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Projeção para o mês</span>
              <span className={`font-medium ${projected > totalAvg * 1.1 ? 'text-red-500' : projected < totalAvg * 0.9 ? 'text-green-600 dark:text-green-400' : ''}`}>
                {fmt(projected)}
              </span>
            </div>
          );
        })()}
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
