'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UpgradeSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl">🎉</div>
      <h1 className="mt-4 text-2xl font-bold">Bem-vindo ao Pro!</h1>
      <p className="mt-2 text-muted-foreground">
        Agora você tem acesso ilimitado a todos os recursos da Cleo.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        Redirecionando para o dashboard...
      </p>
    </div>
  );
}
