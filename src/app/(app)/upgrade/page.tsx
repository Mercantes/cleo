'use client';

import { useState } from 'react';
import { PlanComparison } from '@/components/paywall/plan-comparison';

export default function UpgradePage() {
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
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Escolha seu plano</h1>
        <p className="mt-2 text-muted-foreground">
          Desbloqueie todo o potencial da Cleo para suas finanças
        </p>
      </div>

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
