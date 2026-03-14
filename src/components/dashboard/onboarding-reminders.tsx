'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Landmark, Tags, Target, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';

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
  const { data } = useApi<{ skippedSteps: string[] }>('/api/onboarding');
  const skippedSteps = data?.skippedSteps || [];
  const [dismissed, setDismissed] = useState<string[]>([]);

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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDismissed([...dismissed, stepName])}
                className="h-7 w-7"
                aria-label={`Dispensar ${config.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
