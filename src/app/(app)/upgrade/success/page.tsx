'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function UpgradeSuccessPage() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          router.push('/dashboard');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl">🎉</div>
      <h1 className="mt-4 text-2xl font-bold">Bem-vindo ao Pro!</h1>
      <p className="mt-2 text-muted-foreground">
        Agora você tem acesso ilimitado a todos os recursos da Cleo.
      </p>
      <div className="mt-4 flex flex-col items-center gap-3">
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Transações ilimitadas</li>
          <li>Chat com IA ilimitado</li>
          <li>Conexões bancárias ilimitadas</li>
        </ul>
      </div>
      <Button onClick={() => router.push('/dashboard')} className="mt-6">
        Ir para o Dashboard
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Redirecionando em {seconds}s...
      </p>
    </div>
  );
}
