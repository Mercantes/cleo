'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';

interface SetGoalsStepProps {
  onComplete: (goals: { monthlySavingsTarget?: number; retirementAgeTarget?: number }) => void;
  onSkip: () => void;
}

export function SetGoalsStep({ onComplete, onSkip }: SetGoalsStepProps) {
  const [savingsTarget, setSavingsTarget] = useState('');
  const [retirementAge, setRetirementAge] = useState('');

  const handleComplete = () => {
    onComplete({
      monthlySavingsTarget: savingsTarget ? parseFloat(savingsTarget) : undefined,
      retirementAgeTarget: retirementAge ? parseInt(retirementAge) : undefined,
    });
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <Target className="h-8 w-8 text-green-600 dark:text-green-300" />
      </div>

      <div>
        <h2 className="text-xl font-bold">Defina suas metas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Metas ajudam a Cleo a dar conselhos mais personalizados sobre suas finanças.
        </p>
      </div>

      <div className="space-y-4 text-left">
        <div>
          <label className="text-sm font-medium">Meta de economia mensal (R$)</label>
          <input
            type="number"
            value={savingsTarget}
            onChange={(e) => setSavingsTarget(e.target.value)}
            placeholder="Ex: 500"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Idade alvo para aposentadoria (opcional)</label>
          <input
            type="number"
            value={retirementAge}
            onChange={(e) => setRetirementAge(e.target.value)}
            placeholder="Ex: 55"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleComplete}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Salvar metas
        </button>
        <button
          onClick={onSkip}
          className="w-full rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Pular por agora
        </button>
      </div>
    </div>
  );
}
