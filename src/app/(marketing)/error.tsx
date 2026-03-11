'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';

export default function MarketingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">Algo deu errado</h1>
      <p className="max-w-md text-muted-foreground">
        Ocorreu um erro ao carregar esta página. Tente novamente ou volte ao início.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
