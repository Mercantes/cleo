'use client';

import { Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectBankStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ConnectBankStep({ onComplete, onSkip }: ConnectBankStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Landmark className="h-8 w-8 text-primary" />
      </div>

      <div>
        <h2 className="text-xl font-bold">Conecte seu banco</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Importe suas transações automaticamente para ter uma visão completa das suas finanças.
          Seus dados são criptografados e seguros.
        </p>
      </div>

      <div className="space-y-3">
        <Button onClick={onComplete} className="w-full">
          Conectar banco
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full">
          Pular por agora
        </Button>
      </div>
    </div>
  );
}
