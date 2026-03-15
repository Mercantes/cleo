'use client';

import { Landmark, ShieldCheck, Eye, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectBankStepProps {
  onComplete: () => void;
  onSkip: () => void;
  userName?: string;
}

function TrustBadge({ icon: Icon, title, description }: { icon: typeof ShieldCheck; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ConnectBankStep({ onComplete, onSkip, userName }: ConnectBankStepProps) {
  const greeting = userName ? `Olá, ${userName}!` : 'Olá!';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Landmark className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">{greeting}</h2>
        <p className="mt-1 text-lg text-muted-foreground">Vamos conectar seu banco</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Importe suas transações automaticamente para ter uma visão completa das suas finanças.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <TrustBadge
          icon={ShieldCheck}
          title="Criptografia bancária"
          description="Seus dados são protegidos com criptografia de nível bancário (AES-256)."
        />
        <TrustBadge
          icon={Eye}
          title="Acesso somente leitura"
          description="Apenas visualizamos seus dados. Nunca realizamos transações."
        />
        <TrustBadge
          icon={Unplug}
          title="Desconecte quando quiser"
          description="Você pode remover a conexão a qualquer momento nas configurações."
        />
      </div>

      <div className="space-y-3">
        <Button onClick={onComplete} className="w-full" size="lg">
          Conectar banco
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
          Pular por agora
        </Button>
      </div>
    </div>
  );
}
