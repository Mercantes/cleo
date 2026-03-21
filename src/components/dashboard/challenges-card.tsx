'use client';

import { useState } from 'react';
import { Zap, CheckCircle2, Plus, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { useApi } from '@/hooks/use-api';

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
  available: ChallengeTemplate[];
}

export function ChallengesCard() {
  const { data, isLoading: loading, mutate } = useApi<ChallengesData>('/api/challenges');
  const active = data?.active || [];
  const templates = data?.available || [];
  const [showPicker, setShowPicker] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutateAction = async (
    action: () => Promise<Response>,
    successMsg: string,
    errorMsg: string,
    key: string,
  ) => {
    setActionLoading(key);
    setError(null);
    try {
      const res = await action();
      if (!res.ok) throw new Error();
      mutate();
      toast.success(successMsg);
    } catch {
      setError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const startChallenge = (templateIndex: number) => {
    mutateAction(
      () => fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateIndex }),
      }),
      'Desafio iniciado!',
      'Não foi possível iniciar o desafio.',
      `start-${templateIndex}`,
    ).then(() => setShowPicker(false));
  };

  const completeChallenge = (challengeId: string) =>
    mutateAction(
      () => fetch('/api/challenges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, status: 'completed' }),
      }),
      'Desafio completado! XP ganho',
      'Não foi possível completar o desafio.',
      challengeId,
    );

  const cancelChallenge = (challengeId: string) =>
    mutateAction(
      () => fetch('/api/challenges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, status: 'cancelled' }),
      }),
      'Desafio cancelado',
      'Não foi possível cancelar o desafio.',
      challengeId,
    );

  if (loading) {
    return <div className="h-[200px] animate-pulse rounded-lg border bg-muted" />;
  }

  const daysLeft = (endDate: string) => {
    const diff = Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, diff);
  };

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4 text-yellow-500" />
          Desafios
        </div>
        <button
          onClick={() => setShowPicker(!showPicker)}
          aria-label={showPicker ? 'Fechar seleção de desafios' : 'Novo desafio'}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
        >
          <Plus className="h-3 w-3" />
          Novo
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Active challenges */}
      {active.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-[10px] text-muted-foreground">{active.length} desafio{active.length !== 1 ? 's' : ''} ativo{active.length !== 1 ? 's' : ''}</p>
          {active.map((challenge) => {
            const days = daysLeft(challenge.end_date);
            const isExpired = days === 0;
            const totalDays = Math.ceil(
              (new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) / (1000 * 60 * 60 * 24),
            );
            const elapsed = totalDays - days;
            const daysPct = totalDays > 0 ? Math.min((elapsed / totalDays) * 100, 100) : 100;
            return (
              <div
                key={challenge.id}
                className={`rounded-md border p-3 ${isExpired ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{challenge.title}</p>
                    <p className={`text-xs ${isExpired ? 'font-medium text-red-500' : days <= 2 ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                      {isExpired ? 'Expirado' : days === 0 ? 'Último dia!' : days <= 2 ? `${days} ${days === 1 ? 'dia' : 'dias'} — corre!` : `${days} ${days === 1 ? 'dia' : 'dias'} restantes`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => completeChallenge(challenge.id)}
                      disabled={actionLoading === challenge.id}
                      className="rounded-md p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950 disabled:opacity-50"
                      aria-label={`Completar desafio ${challenge.title}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => cancelChallenge(challenge.id)}
                      disabled={actionLoading === challenge.id}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50"
                      aria-label={`Cancelar desafio ${challenge.title}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${isExpired ? 'bg-red-400' : 'bg-yellow-500'}`}
                    style={{ width: `${daysPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhum desafio ativo. Aceite um desafio para ganhar XP!
        </p>
      )}

      {/* Challenge picker */}
      {showPicker && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">Escolha um desafio:</p>
          {templates.map((template, i) => (
            <button
              key={i}
              onClick={() => startChallenge(i)}
              disabled={actionLoading === `start-${i}`}
              className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{template.title}</p>
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">+{template.xpReward} XP</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
