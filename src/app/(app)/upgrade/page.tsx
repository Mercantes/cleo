'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlanComparison } from '@/components/paywall/plan-comparison';

export default function UpgradePage() {
  const searchParams = useSearchParams();
  const wasCanceled = searchParams.get('canceled') === 'true';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPro = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('checkout_failed');
      }
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('no_url');
      }
    } catch {
      setError('Não foi possível iniciar o checkout. Verifique sua conexão e tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Escolha um plano
        </p>
        <h1 className="mt-1 text-2xl font-bold">Faturamento e Assinatura</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Desbloqueie todo o potencial da Cleo para suas finanças
        </p>
      </div>

      {wasCanceled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Checkout cancelado. Sem problemas — você pode tentar novamente quando quiser.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <PlanComparison onSelectPro={handleSelectPro} loading={loading} />

      <p className="text-center text-xs text-muted-foreground">
        Cancele a qualquer momento. Sem compromisso.
      </p>
    </div>
  );
}
