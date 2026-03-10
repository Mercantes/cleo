'use client';

import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-muted-foreground">Erro</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {error.message || 'Ocorreu um erro ao carregar esta página.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Tentar novamente
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-muted"
        >
          Ir ao Dashboard
        </Link>
      </div>
    </div>
  );
}
