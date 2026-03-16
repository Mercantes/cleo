'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useTier } from '@/hooks/use-tier';

interface ProGateProps {
  feature: string;
  children: React.ReactNode;
}

export function ProGate({ feature, children }: ProGateProps) {
  const { isPro, isLoading } = useTier();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-xl border bg-card px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Recurso exclusivo do plano Pro</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {feature} faz parte do plano Pro. Faça upgrade para desbloquear todas as funcionalidades da Cleo.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/upgrade"
          className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ver planos
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        7 dias grátis &middot; Cancele a qualquer momento
      </p>
    </div>
  );
}
