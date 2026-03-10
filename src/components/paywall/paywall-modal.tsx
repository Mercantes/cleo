'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

const FEATURE_MESSAGES: Record<string, { title: string; description: string }> = {
  transactions: {
    title: 'Limite de transações atingido',
    description: 'Com o plano Pro, importe transações ilimitadas e tenha controle total das suas finanças.',
  },
  chat: {
    title: 'Limite de mensagens atingido',
    description: 'Com o plano Pro, converse ilimitadamente com a Cleo e receba insights personalizados.',
  },
  bank_connections: {
    title: 'Limite de bancos atingido',
    description: 'Com o plano Pro, conecte todos os seus bancos e tenha uma visão completa do seu patrimônio.',
  },
};

interface PaywallModalProps {
  feature: string;
  current: number;
  limit: number;
  onClose: () => void;
}

export function PaywallModal({ feature, current, limit, onClose }: PaywallModalProps) {
  const router = useRouter();
  const message = FEATURE_MESSAGES[feature] || {
    title: 'Limite atingido',
    description: 'Faça upgrade para o plano Pro e desbloqueie recursos ilimitados.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
            <span className="text-2xl">🔒</span>
          </div>

          <h2 className="text-lg font-bold">{message.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{message.description}</p>

          <div className="mt-4 rounded-lg bg-muted p-3">
            <p className="text-sm">
              Uso atual: <span className="font-medium">{current}/{limit}</span>
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => router.push('/upgrade')}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Upgrade para Pro
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Continuar no plano Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for paywall state management
export function usePaywall() {
  const [paywallData, setPaywallData] = useState<{
    feature: string;
    current: number;
    limit: number;
  } | null>(null);

  const showPaywall = (data: { feature: string; current: number; limit: number }) => {
    setPaywallData(data);
  };

  const hidePaywall = () => {
    setPaywallData(null);
  };

  const handleApiResponse = async (response: Response) => {
    if (response.status === 403) {
      const error = await response.json();
      if (error.error === 'TIER_LIMIT_REACHED') {
        showPaywall({
          feature: error.feature,
          current: error.current,
          limit: error.limit,
        });
        return true;
      }
    }
    return false;
  };

  return { paywallData, showPaywall, hidePaywall, handleApiResponse };
}
