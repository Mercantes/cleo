'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlanComparison } from '@/components/paywall/plan-comparison';

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelectPro = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
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

      <PlanComparison onSelectPro={handleSelectPro} loading={loading} />

      <p className="text-center text-xs text-muted-foreground">
        Cancele a qualquer momento. Sem compromisso.
      </p>
    </div>
  );
}
