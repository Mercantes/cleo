'use client';

import { useEffect, useState } from 'react';
import { Target, Flame, Trophy, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';
import Link from 'next/link';

interface GoalData {
  goals: {
    monthly_savings_target: number | null;
    retirement_age_target: number | null;
  } | null;
  progress: {
    currentSavings: number;
    target: number;
    percentage: number;
    income: number;
    expenses: number;
  };
  gamification: {
    level: number;
    xp: number;
    xpToNextLevel: number;
    streak: number;
    bestStreak: number;
    totalChallengesCompleted: number;
  };
}

export function GoalProgressCard() {
  const [data, setData] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithTimeout('/api/goals')
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-[180px] animate-pulse rounded-lg border bg-muted" />;
  }

  if (!data?.goals?.monthly_savings_target) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Target className="h-4 w-4" />
          Metas de economia
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Defina uma meta mensal de economia para acompanhar seu progresso.
        </p>
        <Link
          href="/settings"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Definir meta
        </Link>
      </div>
    );
  }

  const { progress, gamification } = data;
  const isGoalMet = progress.percentage >= 100;
  const xpProgress = Math.round((gamification.xp % 100) / gamification.xpToNextLevel * 100);

  return (
    <div className="space-y-4">
      {/* Savings progress */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className={`h-4 w-4 ${isGoalMet ? 'text-green-500' : 'text-primary'}`} />
            Meta mensal
          </div>
          {isGoalMet && <span className="text-xs font-medium text-green-600 dark:text-green-400">Meta atingida!</span>}
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{formatCurrency(progress.currentSavings)}</p>
            <p className="text-xs text-muted-foreground">
              de {formatCurrency(progress.target)}
            </p>
          </div>
          <p className={`text-lg font-bold ${isGoalMet ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
            {progress.percentage}%
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isGoalMet ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${Math.min(100, progress.percentage)}%` }}
          />
        </div>
      </div>

      {/* Gamification stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <Star className="mx-auto h-5 w-5 text-yellow-500" />
          <p className="mt-1 text-lg font-bold">Lv.{gamification.level}</p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-yellow-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{gamification.xp} XP</p>
        </div>

        <div className="rounded-lg border bg-card p-3 text-center">
          <Flame className="mx-auto h-5 w-5 text-orange-500" />
          <p className="mt-1 text-lg font-bold">{gamification.streak}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {gamification.streak === 1 ? 'mês' : 'meses'} seguidos
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3 text-center">
          <Trophy className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-1 text-lg font-bold">{gamification.totalChallengesCompleted}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">desafios</p>
        </div>
      </div>
    </div>
  );
}
