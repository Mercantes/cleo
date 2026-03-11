'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Erro ao carregar o dashboard</h1>
      <p className="max-w-md text-muted-foreground">
        Não foi possível carregar seus dados financeiros. Tente novamente.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Página inicial
        </Link>
      </div>
    </div>
  );
}
