'use client';

import { Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewCategoriesStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ReviewCategoriesStep({ onComplete, onSkip }: ReviewCategoriesStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
        <Tags className="h-8 w-8 text-violet-600 dark:text-violet-300" />
      </div>

      <div>
        <h2 className="text-xl font-bold">Revise suas categorias</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A Cleo usa IA para categorizar suas transações automaticamente.
          Revise e ajuste se necessário.
        </p>
      </div>

      <div className="rounded-lg border p-4 text-left">
        <p className="text-sm text-muted-foreground">
          Suas transações serão categorizadas automaticamente conforme são importadas.
          Você pode revisar e ajustar as categorias a qualquer momento na tela de transações.
        </p>
      </div>

      <div className="space-y-3">
        <Button onClick={onComplete} className="w-full">
          Entendido!
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full">
          Pular por agora
        </Button>
      </div>
    </div>
  );
}
