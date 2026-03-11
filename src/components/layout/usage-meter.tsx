'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

interface UsageData {
  tier: 'free' | 'pro';
  transactions: { current: number; limit: number };
  chat: { current: number; limit: number };
}

export function UsageMeter() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetchWithTimeout('/api/usage')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setUsage(d);
      })
      .catch(() => {});
  }, []);

  if (!usage || usage.tier === 'pro') return null;

  const items = [
    { label: 'Transações', current: usage.transactions.current, limit: usage.transactions.limit },
    { label: 'Chat', current: usage.chat.current, limit: usage.chat.limit },
  ];

  return (
    <div className="border-t p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Uso mensal (Free)</p>
      <div className="space-y-2">
        {items.map((item) => {
          const pct = Math.min((item.current / item.limit) * 100, 100);
          const isHigh = pct >= 80;
          return (
            <div key={item.label}>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={isHigh ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
                  {item.current}/{item.limit}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    isHigh ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <Link
        href="/upgrade"
        className="mt-2 block text-center text-xs font-medium text-primary hover:underline"
      >
        Upgrade para Pro
      </Link>
    </div>
  );
}
