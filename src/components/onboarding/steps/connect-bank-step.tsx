'use client';

import { ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectBankStepProps {
  onComplete: () => void;
  onSkip: () => void;
  userName?: string;
}

export function ConnectBankStep({ onComplete, onSkip, userName }: ConnectBankStepProps) {
  const greeting = userName ? `Ola, ${userName}!` : 'Ola!';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg">{greeting}</p>
        <h2 className="mt-1 text-xl font-bold">Conecte sua conta principal</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Conecte seu banco para ver seus gastos categorizados automaticamente, detectar parcelas e assinaturas, e ver suas financas com clareza.
        </p>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Seguro e somente leitura
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          <span className="text-sm">Criptografado com seguranca bancaria</span>
        </div>
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          <span className="text-sm">Acesso somente leitura — nunca movemos seu dinheiro</span>
        </div>
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          <span className="text-sm">Desconecte a qualquer momento nas configuracoes</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <Button onClick={onComplete} className="w-full" size="lg">
          Conectar conta bancaria
        </Button>
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Pular por enquanto
        </button>
      </div>
    </div>
  );
}
