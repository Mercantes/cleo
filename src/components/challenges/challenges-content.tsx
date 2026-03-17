'use client';

import { useState } from 'react';
import {
  Trophy,
  Flame,
  Star,
  CheckCircle2,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  type: string;
  target_amount: number | null;
  status: string;
  start_date: string;
  end_date: string;
  completed_at: string | null;
}

interface ChallengeTemplate {
  title: string;
  description: string;
  type: string;
  xpReward: number;
}

interface ChallengesData {
  active: Challenge[];
  completed: Challenge[];
  available: ChallengeTemplate[];
}

interface GoalsData {
  level: number;
  xp: number;
  totalChallengesCompleted: number;
}

function daysRemaining(endDate: string): number {
  const end = new Date(endDate + 'T23:59:59');
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function progressPercent(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00').getTime();
  const e = new Date(end + 'T23:59:59').getTime();
  const now = Date.now();
  if (now >= e) return 100;
  if (now <= s) return 0;
  return Math.round(((now - s) / (e - s)) * 100);
}

const TYPE_ICONS: Record<string, string> = {
  savings: '💰',
  no_spend: '🚫',
  spending_limit: '📊',
  custom: '🎯',
};

export function ChallengesContent() {
  const { data, isLoading, mutate } = useApi<ChallengesData>('/api/challenges');
  const { data: goalsData } = useApi<GoalsData>('/api/goals');
  const [starting, setStarting] = useState<number | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const active = data?.active || [];
  const completed = data?.completed || [];
  const available = data?.available || [];
  const level = goalsData?.level || 1;
  const xp = goalsData?.xp || 0;
  const totalCompleted = goalsData?.totalChallengesCompleted || 0;
  const xpToNext = ((level) * 100) - xp;

  async function handleStart(templateIndex: number) {
    setStarting(templateIndex);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateIndex }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success('Desafio iniciado!');
    } catch {
      toast.error('Erro ao iniciar desafio');
    } finally {
      setStarting(null);
    }
  }

  async function handleComplete(challengeId: string) {
    setCompleting(challengeId);
    try {
      const res = await fetch('/api/challenges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, status: 'completed' }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success('Desafio concluído! +50 XP');
    } catch {
      toast.error('Erro ao concluir desafio');
    } finally {
      setCompleting(null);
    }
  }

  async function handleCancel(challengeId: string) {
    try {
      const res = await fetch('/api/challenges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, status: 'cancelled' }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success('Desafio cancelado');
    } catch {
      toast.error('Erro ao cancelar desafio');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level & XP card */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
            <Star className="h-7 w-7 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">Nível {level}</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                {xp} XP
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${(xp % 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {xpToNext > 0 ? `${xpToNext} XP para o próximo nível` : 'Próximo nível!'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-6 border-t pt-3 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Completos:</span>
            <span className="font-medium">{totalCompleted}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Ativos:</span>
            <span className="font-medium">{active.length}</span>
          </div>
        </div>
      </div>

      {/* Active challenges */}
      {active.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Flame className="h-5 w-5 text-orange-500" />
            Desafios Ativos
          </h2>
          <div className="space-y-3">
            {active.map((challenge) => {
              const days = daysRemaining(challenge.end_date);
              const progress = progressPercent(challenge.start_date, challenge.end_date);
              const expired = days === 0;

              return (
                <div key={challenge.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-2xl">{TYPE_ICONS[challenge.type] || '🎯'}</span>
                      <div>
                        <p className="text-sm font-medium">{challenge.title}</p>
                        {challenge.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{challenge.description}</p>
                        )}
                        <p className={cn('mt-1 text-xs', expired ? 'text-red-500' : 'text-muted-foreground')}>
                          <Clock className="mr-1 inline h-3 w-3" />
                          {expired ? 'Expirado' : `${days} dia${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="bg-emerald-500 text-white hover:bg-emerald-600"
                        onClick={() => handleComplete(challenge.id)}
                        disabled={completing === challenge.id}
                      >
                        {completing === challenge.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        )}
                        Concluir
                      </Button>
                      <button
                        onClick={() => handleCancel(challenge.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                        title="Cancelar desafio"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all', expired ? 'bg-red-500' : 'bg-emerald-500')}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Completed challenges */}
      {completed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Trophy className="h-5 w-5 text-amber-500" />
            Concluídos
          </h2>
          <div className="space-y-2">
            {completed.map((challenge) => (
              <div key={challenge.id} className="flex items-center gap-3 rounded-lg border bg-card/50 p-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{challenge.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Concluído em {new Date(challenge.completed_at!).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  +50 XP
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available templates */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Star className="h-5 w-5 text-muted-foreground" />
          Desafios Disponíveis
        </h2>
        {available.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Todos os desafios iniciados"
            description="Você já começou todos os desafios disponíveis. Conclua os ativos para liberar novos!"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {available.map((template, idx) => (
              <div key={idx} className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{TYPE_ICONS[template.type] || '🎯'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{template.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        +{template.xpReward} XP
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStart(idx)}
                        disabled={starting === idx}
                      >
                        {starting === idx ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Flame className="mr-1 h-3.5 w-3.5" />
                        )}
                        Começar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
