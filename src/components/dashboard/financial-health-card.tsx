'use client';

import { useEffect, useState } from 'react';
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

interface HealthData {
  score: number;
  factors: { label: string; status: 'good' | 'warning' | 'bad'; detail: string }[];
}

function calculateHealth(summary: {
  income: number;
  expenses: number;
  savingsRate: number;
  percentChange: number;
}, goalsProgress: number, recurringPercent: number): HealthData {
  let score = 50;
  const factors: HealthData['factors'] = [];

  // Savings rate (0-30 points)
  if (summary.savingsRate >= 20) {
    score += 30;
    factors.push({ label: 'Taxa de economia', status: 'good', detail: `${Math.round(summary.savingsRate)}% da renda` });
  } else if (summary.savingsRate >= 10) {
    score += 15;
    factors.push({ label: 'Taxa de economia', status: 'warning', detail: `${Math.round(summary.savingsRate)}% da renda` });
  } else {
    factors.push({ label: 'Taxa de economia', status: 'bad', detail: `${Math.round(summary.savingsRate)}% da renda` });
  }

  // Spending trend (-10 to +10 points)
  if (summary.percentChange < -5) {
    score += 10;
    factors.push({ label: 'Tendência de gastos', status: 'good', detail: `${Math.abs(Math.round(summary.percentChange))}% menor que mês anterior` });
  } else if (summary.percentChange > 15) {
    score -= 10;
    factors.push({ label: 'Tendência de gastos', status: 'bad', detail: `${Math.round(summary.percentChange)}% maior que mês anterior` });
  } else {
    factors.push({ label: 'Tendência de gastos', status: 'warning', detail: 'Estável' });
  }

  // Recurring expenses ratio (-5 to +5)
  if (recurringPercent <= 30) {
    score += 5;
    factors.push({ label: 'Gastos fixos', status: 'good', detail: `${recurringPercent}% da renda` });
  } else if (recurringPercent <= 50) {
    factors.push({ label: 'Gastos fixos', status: 'warning', detail: `${recurringPercent}% da renda` });
  } else {
    score -= 5;
    factors.push({ label: 'Gastos fixos', status: 'bad', detail: `${recurringPercent}% da renda` });
  }

  // Goal progress (0-5 points)
  if (goalsProgress >= 75) {
    score += 5;
    factors.push({ label: 'Progresso da meta', status: 'good', detail: `${goalsProgress}% atingido` });
  } else if (goalsProgress >= 40) {
    factors.push({ label: 'Progresso da meta', status: 'warning', detail: `${goalsProgress}% atingido` });
  } else if (goalsProgress > 0) {
    factors.push({ label: 'Progresso da meta', status: 'bad', detail: `${goalsProgress}% atingido` });
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
}

const statusColors = {
  good: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  bad: 'text-red-500 dark:text-red-400',
};

const statusIcons = { good: '●', warning: '●', bad: '●' };

function getScoreColor(score: number) {
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Boa';
  if (score >= 40) return 'Regular';
  return 'Precisa de atenção';
}

export function FinancialHealthCard() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    Promise.all([
      fetchWithTimeout('/api/dashboard/summary').then((r) => r.ok ? r.json() : null),
      fetchWithTimeout('/api/goals').then((r) => r.ok ? r.json() : null),
      fetchWithTimeout('/api/recurring').then((r) => r.ok ? r.json() : null),
    ])
      .then(([summary, goals, recurring]) => {
        if (!summary || summary.income === 0) return;
        const goalsProgress = goals?.progress?.percentage || 0;
        const recurringPercent = summary.income > 0
          ? Math.round(((recurring?.monthlyTotal || 0) / summary.income) * 100)
          : 0;
        setHealth(calculateHealth(summary, goalsProgress, recurringPercent));
      })
      .catch(() => {});
  }, []);

  if (!health) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Saúde Financeira</h3>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${getScoreColor(health.score)}`}>{health.score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <p className={`mt-0.5 text-xs font-medium ${getScoreColor(health.score)}`}>{getScoreLabel(health.score)}</p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            health.score >= 70 ? 'bg-green-500' : health.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${health.score}%` }}
        />
      </div>

      <div className="mt-3 space-y-1.5">
        {health.factors.map((f) => (
          <div key={f.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className={statusColors[f.status]}>{statusIcons[f.status]}</span>
              {f.label}
            </span>
            <span className="text-muted-foreground">{f.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
