'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';

interface UsageItem {
  feature: string;
  allowed: boolean;
  current: number;
  limit: number;
  tier: string;
}

const FEATURE_LABELS: Record<string, string> = {
  transactions: 'Transações',
  chat: 'Mensagens de chat',
  bank_connections: 'Bancos conectados',
};

const FEATURE_PERIOD: Record<string, string> = {
  transactions: '/mês',
  chat: '/mês',
  bank_connections: 'total',
};

export function TierStatus() {
  const { data: tierData, isLoading: loading } = useApi<{ usage: UsageItem[] }>('/api/tier');
  const usage = tierData?.usage || [];

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (usage.length === 0) return null;

  const tier = usage[0]?.tier || 'free';
  const isPro = tier === 'pro';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Plano</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isPro
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>
        {!isPro && (
          <Link
            href="/upgrade"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upgrade para Pro
          </Link>
        )}
      </div>

      {isPro ? (
        <div className="space-y-3">
          <div className="space-y-2 rounded-lg border bg-violet-50 p-3 dark:bg-violet-950">
            {['Transações ilimitadas', 'Chat ilimitado', 'Bancos ilimitados', 'Projeções avançadas'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300">
                <Check className="h-3.5 w-3.5" />
                {f}
              </div>
            ))}
          </div>
          <ManageSubscriptionButton />
        </div>
      ) : (
        <div className="space-y-3">
          {usage.map((item) => {
            const percentage = item.limit === Infinity ? 0 : Math.min(100, (item.current / item.limit) * 100);
            const isNearLimit = percentage >= 80;

            return (
              <div key={item.feature} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {FEATURE_LABELS[item.feature] || item.feature}
                  </span>
                  <span className={isNearLimit ? 'font-medium text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}>
                    {item.current}/{item.limit} {FEATURE_PERIOD[item.feature] || ''}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isNearLimit ? 'bg-orange-500' : 'bg-primary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (!res.ok) throw new Error('portal_failed');
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" className="w-full" onClick={openPortal} disabled={loading}>
      {loading ? 'Abrindo...' : 'Gerenciar assinatura'}
    </Button>
  );
}
