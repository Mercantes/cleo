'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Landmark, Tags, Target, X } from 'lucide-react';

const STEP_CONFIG: Record<string, { icon: typeof Landmark; label: string; description: string }> = {
  'connect-bank': {
    icon: Landmark,
    label: 'Conecte seu banco',
    description: 'Importe transações automaticamente',
  },
  'review-categories': {
    icon: Tags,
    label: 'Revise categorias',
    description: 'Confira como suas transações foram categorizadas',
  },
  'set-goals': {
    icon: Target,
    label: 'Defina suas metas',
    description: 'Configure metas de economia e aposentadoria',
  },
};

export function OnboardingReminders() {
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/onboarding')
      .then((r) => r.json())
      .then((data) => {
        if (data.skippedSteps?.length) {
          setSkippedSteps(data.skippedSteps);
        }
      })
      .catch(() => {});
  }, []);

  const visibleSteps = skippedSteps.filter((s) => !dismissed.includes(s));

  if (visibleSteps.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleSteps.map((stepName) => {
        const config = STEP_CONFIG[stepName];
        if (!config) return null;
        const Icon = config.icon;

        return (
          <div
            key={stepName}
            className="flex items-center justify-between rounded-lg border border-dashed p-3"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/onboarding"
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Completar
              </Link>
              <button
                onClick={() => setDismissed([...dismissed, stepName])}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
