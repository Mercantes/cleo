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
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boundary: 'root',
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold">Algo deu errado</h1>
      <p className="max-w-md text-muted-foreground">
        Ocorreu um erro inesperado. Tente recarregar a página ou volte ao início.
      </p>
      <pre className="max-w-lg overflow-auto rounded bg-muted p-3 text-left text-xs">
        {error.message}
        {'\n'}
        {error.digest && `digest: ${error.digest}`}
        {'\n'}
        {error.stack?.substring(0, 300)}
      </pre>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
