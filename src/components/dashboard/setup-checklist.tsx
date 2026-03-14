'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Landmark, Target, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

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
  return localStorage.getItem('cleo_setup_dismissed') === '1';
}

export function SetupChecklist() {
  const [steps, setSteps] = useState<SetupStep[] | null>(null);
  const [dismissed, setDismissed] = useState(getInitialDismissed);

  useEffect(() => {
    if (dismissed) return;

    Promise.all([
      fetchWithTimeout('/api/dashboard/accounts').then((r) => r.ok ? r.json() : null),
      fetchWithTimeout('/api/goals').then((r) => r.ok ? r.json() : null),
      fetchWithTimeout('/api/chat/history').then((r) => r.ok ? r.json() : null),
    ].map((p) => p.catch(() => null)))
      .then(([accounts, goals, chatHistory]) => {
        const hasBank = (accounts?.accounts?.length || 0) > 0;
        const hasGoals = !!goals?.goals?.monthly_savings_target;
        const hasChatted = (chatHistory?.messages?.length || 0) > 0;

        const setupSteps: SetupStep[] = [
          {
            id: 'bank',
            label: 'Conectar banco',
            description: 'Importe transações automaticamente',
            href: '/settings?tab=banks',
            icon: Landmark,
            completed: hasBank,
          },
          {
            id: 'goals',
            label: 'Definir meta de economia',
            description: 'Acompanhe seu progresso mensal',
            href: '/settings?tab=goals',
            icon: Target,
            completed: hasGoals,
          },
          {
            id: 'chat',
            label: 'Conversar com a Cleo',
            description: 'Peça dicas personalizadas',
            href: '/chat',
            icon: Sparkles,
            completed: hasChatted,
          },
        ];

        // Only show if not everything is done
        const allDone = setupSteps.every((s) => s.completed);
        if (!allDone) {
          setSteps(setupSteps);
        }
      });
  }, [dismissed]);

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
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50',
              step.completed && 'opacity-60',
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
        ))}
      </div>
    </div>
  );
}
