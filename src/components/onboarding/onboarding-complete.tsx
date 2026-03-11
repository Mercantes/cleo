'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function OnboardingComplete() {
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
      <Image
        src="/logo.png"
        alt="Cleo"
        width={80}
        height={80}
        className="rounded-2xl"
      />
      <h1 className="mt-4 text-2xl font-bold">Tudo pronto!</h1>
      <p className="mt-2 text-muted-foreground">
        Sua conta está configurada. A Cleo já está pronta para ajudar com suas finanças.
      </p>
      <Button onClick={() => router.push('/dashboard')} className="mt-6">
        Ir para o Dashboard
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        Redirecionando em {seconds}s...
      </p>
    </div>
  );
}
