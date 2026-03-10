'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function OnboardingComplete() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl">🎉</div>
      <h1 className="mt-4 text-2xl font-bold">Tudo pronto!</h1>
      <p className="mt-2 text-muted-foreground">
        Sua conta está configurada. A Cleo já está pronta para ajudar com suas finanças.
      </p>
      <button
        onClick={() => router.push('/')}
        className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Ir para o Dashboard
      </button>
      <p className="mt-4 text-xs text-muted-foreground">
        Redirecionando automaticamente...
      </p>
    </div>
  );
}
