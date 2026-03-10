'use client';

import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Conectar banco' },
  { label: 'Categorias' },
  { label: 'Metas' },
];

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
}

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <ol className="flex items-center justify-center gap-2" aria-label="Etapas de configuração">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;

        return (
          <li
            key={step.label}
            className="flex items-center gap-2"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
                aria-label={
                  isCompleted
                    ? `${step.label} — concluído`
                    : isCurrent
                      ? `${step.label} — etapa atual`
                      : `${step.label} — pendente`
                }
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`text-xs ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`mb-4 h-0.5 w-8 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
