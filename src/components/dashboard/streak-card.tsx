'use client';

import { Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { useApi } from '@/hooks/use-api';

interface MonthData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  metGoal: boolean;
}

interface StreakData {
  months: MonthData[];
  currentStreak: number;
  bestStreak: number;
  target: number;
}

export function StreakCard() {
  const [hideValues] = useHideValues();
  const { data, isLoading: loading } = useApi<StreakData>('/api/goals/streak');
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-4 flex items-end gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-2.5 w-6 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.target <= 0 || data.months.length === 0) {
    return null;
  }
  const { months, currentStreak, bestStreak } = data;
  // Show last 6 months for compact display
  const displayMonths = months.slice(-6);

  // Determine the current month string (e.g., "mar") for comparison
  const now = new Date();
  const currentMonthStr = now.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toLowerCase();

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Flame className={cn('h-4 w-4', currentStreak >= 2 ? 'text-orange-500' : 'text-muted-foreground')} />
          Sequência de metas
        </div>
        {bestStreak > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Recorde: {bestStreak} {bestStreak === 1 ? 'mês' : 'meses'}
          </div>
        )}
      </div>

      {/* Current streak highlight */}
      <div className="mt-3 flex items-center gap-3">
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold',
          currentStreak >= 3
            ? 'bg-orange-500/10 text-orange-500'
            : currentStreak >= 1
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-muted text-muted-foreground',
        )}>
          {currentStreak}
        </div>
        <div>
          <p className="text-sm font-medium">
            {currentStreak === 0
              ? 'Nenhum mês na meta'
              : currentStreak === 1
                ? '1 mês consecutivo'
                : `${currentStreak} meses consecutivos`}
          </p>
          <p className="text-xs text-muted-foreground">
            Meta: {fmt(data.target)}/mês
          </p>
        </div>
      </div>

      {/* Month dots visualization */}
      <div className="mt-4 flex items-end gap-1.5">
        {displayMonths.map((m, i) => {
          const isCurrentMonth = m.month.toLowerCase() === currentMonthStr;
          const isInProgress = isCurrentMonth && !m.metGoal;
          return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-8 w-full items-center justify-center rounded-md text-[10px] font-medium transition-colors',
                m.metGoal
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                  : isInProgress
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : m.savings > 0
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground',
              )}
              title={`${m.month}: ${fmt(m.savings)} economizado${isInProgress ? ' (em andamento)' : ''}`}
            >
              {m.metGoal ? '✓' : isInProgress ? '⋯' : m.savings > 0 ? '~' : '—'}
            </div>
            <span className="text-[10px] text-muted-foreground capitalize">{m.month}</span>
          </div>
          );
        })}
      </div>
      {displayMonths.length >= 2 && (() => {
        const metCount = displayMonths.filter(m => m.metGoal).length;
        return (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Meta atingida em {metCount} de {displayMonths.length} meses ({Math.round((metCount / displayMonths.length) * 100)}%)
          </p>
        );
      })()}

      {currentStreak >= 1 && (() => {
        const streakSavings = months.slice(-currentStreak).reduce((s, m) => s + m.savings, 0);
        return streakSavings > 0 ? (
          <p className="mt-3 text-xs text-green-600 dark:text-green-400">
            {currentStreak >= 2
              ? `Você economizou ${fmt(streakSavings)} nessa sequência. Continue assim!`
              : `Você economizou ${fmt(streakSavings)} este mês. Mantenha o ritmo!`}
          </p>
        ) : null;
      })()}
    </div>
  );
}
