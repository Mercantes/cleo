'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

interface HealthFactor {
  label: string;
  status: 'good' | 'warning' | 'bad';
  detail: string;
  tip: string;
  actionLabel?: string;
  actionHref?: string;
}

interface HealthData {
  score: number;
  factors: HealthFactor[];
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
    factors.push({ label: 'Taxa de economia', status: 'good', detail: `${Math.round(summary.savingsRate)}% da renda`, tip: 'Parabéns! Você está economizando acima da meta de 20%. Continue assim!', actionLabel: 'Ver metas', actionHref: '/goals' });
  } else if (summary.savingsRate >= 10) {
    score += 15;
    factors.push({ label: 'Taxa de economia', status: 'warning', detail: `${Math.round(summary.savingsRate)}% da renda`, tip: 'Tente aumentar para 20% revisando assinaturas e gastos variáveis.', actionLabel: 'Ver recorrentes', actionHref: '/subscriptions' });
  } else {
    factors.push({ label: 'Taxa de economia', status: 'bad', detail: `${Math.round(summary.savingsRate)}% da renda`, tip: 'Identifique 2-3 gastos que podem ser cortados. Use o chat da Cleo para sugestões personalizadas.', actionLabel: 'Pedir dicas', actionHref: '/chat?q=Como+posso+economizar+mais' });
  }

  // Spending trend (-10 to +10 points)
  if (summary.percentChange < -5) {
    score += 10;
    factors.push({ label: 'Tendência de gastos', status: 'good', detail: `${Math.abs(Math.round(summary.percentChange))}% menor que mês anterior`, tip: 'Seus gastos estão diminuindo. Ótimo progresso!', actionLabel: 'Ver relatório', actionHref: '/reports' });
  } else if (summary.percentChange > 15) {
    score -= 10;
    factors.push({ label: 'Tendência de gastos', status: 'bad', detail: `${Math.round(summary.percentChange)}% maior que mês anterior`, tip: 'Gastos aumentaram significativamente. Verifique suas categorias para identificar o motivo.', actionLabel: 'Ver categorias', actionHref: '/categories' });
  } else {
    factors.push({ label: 'Tendência de gastos', status: 'warning', detail: 'Estável', tip: 'Seus gastos estão estáveis. Procure oportunidades de redução para melhorar a economia.', actionLabel: 'Ver categorias', actionHref: '/categories' });
  }

  // Recurring expenses ratio (-5 to +5)
  if (recurringPercent <= 30) {
    score += 5;
    factors.push({ label: 'Gastos fixos', status: 'good', detail: `${recurringPercent}% da renda`, tip: 'Seus gastos fixos estão em nível saudável. Boa gestão!', actionLabel: 'Ver recorrentes', actionHref: '/subscriptions' });
  } else if (recurringPercent <= 50) {
    factors.push({ label: 'Gastos fixos', status: 'warning', detail: `${recurringPercent}% da renda`, tip: 'Revise assinaturas e serviços. O ideal é manter gastos fixos abaixo de 30% da renda.', actionLabel: 'Revisar assinaturas', actionHref: '/subscriptions' });
  } else {
    score -= 5;
    factors.push({ label: 'Gastos fixos', status: 'bad', detail: `${recurringPercent}% da renda`, tip: 'Gastos fixos muito altos. Considere renegociar contratos ou cancelar serviços não essenciais.', actionLabel: 'Revisar assinaturas', actionHref: '/subscriptions' });
  }

  // Goal progress (0-5 points)
  if (goalsProgress >= 75) {
    score += 5;
    factors.push({ label: 'Progresso da meta', status: 'good', detail: `${goalsProgress}% atingido`, tip: 'Quase lá! Mantenha o ritmo para atingir sua meta este mês.', actionLabel: 'Ver metas', actionHref: '/goals' });
  } else if (goalsProgress >= 40) {
    factors.push({ label: 'Progresso da meta', status: 'warning', detail: `${goalsProgress}% atingido`, tip: 'Progresso moderado. Tente reservar um valor fixo no início do mês.', actionLabel: 'Ver metas', actionHref: '/goals' });
  } else if (goalsProgress > 0) {
    factors.push({ label: 'Progresso da meta', status: 'bad', detail: `${goalsProgress}% atingido`, tip: 'Meta em risco. Configure uma transferência automática para sua poupança.', actionLabel: 'Ajustar meta', actionHref: '/settings?tab=goals' });
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
  const { data: summary } = useApi<{ income: number; expenses: number; savingsRate: number; percentChange: number }>('/api/dashboard/summary');
  const { data: goals } = useApi<{ progress?: { percentage: number } }>('/api/goals');
  const { data: recurring } = useApi<{ monthlyTotal: number }>('/api/recurring');
  const health = useMemo(() => {
    if (!summary || summary.income === 0) return null;
    const goalsProgress = goals?.progress?.percentage || 0;
    const recurringPercent = summary.income > 0
      ? Math.round(((recurring?.monthlyTotal || 0) / summary.income) * 100)
      : 0;
    return calculateHealth(summary, goalsProgress, recurringPercent);
  }, [summary, goals, recurring]);

  // Auto-expand first "bad" factor to guide user action
  const initialExpanded = useMemo(() => {
    if (!health) return null;
    const bad = health.factors.find(f => f.status === 'bad');
    return bad?.label ?? null;
  }, [health]);

  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const prevInitialRef = useRef<string | null>(null);
  if (initialExpanded !== prevInitialRef.current) {
    prevInitialRef.current = initialExpanded;
    if (initialExpanded && expandedFactor === null) {
      setExpandedFactor(initialExpanded);
    }
  }

  if (!health) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium">Saúde Financeira</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          Conecte seu banco e registre transações para ver sua pontuação de saúde financeira.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Saúde Financeira</h3>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${getScoreColor(health.score)}`}>{health.score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        <span className={`text-xs font-medium ${getScoreColor(health.score)}`}>{getScoreLabel(health.score)}</span>
        <span className="text-[11px] text-muted-foreground">
          {health.factors.filter(f => f.status === 'good').length} ok
          {health.factors.filter(f => f.status === 'warning').length > 0 && ` · ${health.factors.filter(f => f.status === 'warning').length} atenção`}
          {health.factors.filter(f => f.status === 'bad').length > 0 && ` · ${health.factors.filter(f => f.status === 'bad').length} ${health.factors.filter(f => f.status === 'bad').length === 1 ? 'crítico' : 'críticos'}`}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            health.score >= 70 ? 'bg-green-500' : health.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${health.score}%` }}
        />
      </div>
      {health.score < 60 && (() => {
        const worstFactor = health.factors.find(f => f.status === 'bad') || health.factors.find(f => f.status === 'warning');
        return worstFactor ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Prioridade: <span className="font-medium">{worstFactor.label.toLowerCase()}</span> — {worstFactor.detail.toLowerCase()}
          </p>
        ) : null;
      })()}

      <div className="mt-3 space-y-1">
        {health.factors.map((f) => {
          const isExpanded = expandedFactor === f.label;
          return (
            <div key={f.label}>
              <button
                onClick={() => setExpandedFactor(isExpanded ? null : f.label)}
                className="flex w-full items-center justify-between rounded-md px-1 py-1 text-xs transition-colors hover:bg-muted/50"
                aria-expanded={isExpanded}
              >
                <span className="flex items-center gap-1.5">
                  <span className={statusColors[f.status]}>{statusIcons[f.status]}</span>
                  {f.label}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground">{f.detail}</span>
                  <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                </span>
              </button>
              {isExpanded && (
                <div className="ml-5 mt-0.5 rounded-md bg-muted/50 px-2 py-1.5">
                  <p className="text-[11px] text-muted-foreground">{f.tip}</p>
                  {f.actionHref && (
                    <Link
                      href={f.actionHref}
                      className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
                    >
                      {f.actionLabel} <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
