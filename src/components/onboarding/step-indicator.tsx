'use client';

const TOTAL_STEPS = 4;

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
}

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="flex justify-center gap-2" aria-label="Etapas de configuracao">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;
        return (
          <div
            key={index}
            className={`h-2 rounded-full transition-all ${
              isCurrent
                ? 'w-8 bg-primary'
                : isCompleted
                  ? 'w-2 bg-primary/60'
                  : 'w-2 bg-muted'
            }`}
            role="img"
            aria-label={
              isCompleted
                ? `Etapa ${index + 1} — concluida`
                : isCurrent
                  ? `Etapa ${index + 1} — atual`
                  : `Etapa ${index + 1} — pendente`
            }
          />
        );
      })}
    </div>
  );
}
