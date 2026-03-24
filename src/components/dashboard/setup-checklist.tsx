'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Landmark, Target, Sparkles, Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

interface SetupStep {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  completed: boolean;
}

function getInitialDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('cleo_setup_dismissed') === '1';
  } catch {
    return false;
  }
}

export function SetupChecklist() {
  const [dismissed, setDismissed] = useState(getInitialDismissed);

  // Pass null to skip fetching when dismissed
  const { data: accounts } = useApi<{ accounts: { id: string }[] }>(dismissed ? null : '/api/dashboard/accounts');
  const { data: goals } = useApi<{ goals: { monthly_savings_target: number | null } | null }>(dismissed ? null : '/api/goals');
  const { data: chatHistory } = useApi<{ messages: { id: string }[] }>(dismissed ? null : '/api/chat/history');

  const hasNotifications = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window && Notification.permission === 'granted';
  }, []);

  const steps = useMemo<SetupStep[] | null>(() => {
    if (dismissed || !accounts || !goals || !chatHistory) return null;

    const setupSteps: SetupStep[] = [
      {
        id: 'bank',
        label: 'Conectar banco',
        description: 'Importe transações automaticamente',
        href: '/accounts',
        icon: Landmark,
        completed: (accounts.accounts?.length || 0) > 0,
      },
      {
        id: 'goals',
        label: 'Definir meta de economia',
        description: 'Acompanhe seu progresso mensal',
        href: '/goals',
        icon: Target,
        completed: !!goals.goals?.monthly_savings_target,
      },
      {
        id: 'chat',
        label: 'Conversar com a Cleo',
        description: 'Peça dicas personalizadas',
        href: '/chat',
        icon: Sparkles,
        completed: (chatHistory.messages?.length || 0) > 0,
      },
      {
        id: 'notifications',
        label: 'Ativar notificações',
        description: 'Receba alertas e resumos semanais',
        href: '/dashboard',
        icon: Bell,
        completed: hasNotifications,
      },
    ];

    return setupSteps.every((s) => s.completed) ? null : setupSteps;
  }, [dismissed, accounts, goals, chatHistory, hasNotifications]);

  if (dismissed || !steps) return null;

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('cleo_setup_dismissed', '1');
  }

  return (
    <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Configure sua Cleo</h3>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{steps.length} passos completos
            {completedCount > 0 && completedCount < steps.length && ' — quase lá!'}
            {completedCount === 0 && ' — comece agora'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Dispensar checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="mt-3 space-y-1">
        {steps.map((step, idx) => {
          const isNext = !step.completed && steps.slice(0, idx).every(s => s.completed) || (!step.completed && idx === steps.findIndex(s => !s.completed));
          return (
          <Link
            key={step.id}
            href={step.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50',
              step.completed && 'opacity-60',
              isNext && 'bg-primary/5 ring-1 ring-primary/20',
            )}
          >
            {step.completed ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', step.completed && 'line-through')}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            <step.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
          );
        })}
      </div>
    </div>
  );
}
