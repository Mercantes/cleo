'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';

export default function UpgradeSuccessError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Erro na confirmação</h1>
      <p className="max-w-md text-muted-foreground">
        Seu pagamento foi processado, mas houve um erro ao exibir a confirmação.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
