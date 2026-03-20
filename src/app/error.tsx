'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report error to server logs for debugging
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold">Algo deu errado</h1>
      <p className="max-w-md text-muted-foreground">
        Ocorreu um erro inesperado. Tente recarregar a página ou volte ao início.
      </p>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="max-w-lg overflow-auto rounded bg-muted p-3 text-left text-xs">
          {error.message}
        </pre>
      )}
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
