'use client';

import { useEffect, useState } from 'react';
import { Repeat } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import Link from 'next/link';

interface RecurringItem {
  merchant: string;
  amount: number;
  frequency: string;
  type: string;
  next_expected_date: string;
  installments_remaining?: number;
}

interface RecurringData {
  subscriptions: RecurringItem[];
  installments: RecurringItem[];
  monthlyTotal: number;
}

export function SubscriptionsCard() {
  const [data, setData] = useState<RecurringData | null>(null);

  useEffect(() => {
    fetch('/api/recurring')
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || (data.subscriptions.length === 0 && data.installments.length === 0)) {
    return null;
  }

  const total = data.subscriptions.length + data.installments.length;

  return (
    <Link href="/subscriptions" className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Compromissos Recorrentes</p>
        </div>
        <span className="text-xs text-muted-foreground">{total} ativo{total > 1 ? 's' : ''}</span>
      </div>
      <p className="mt-1 text-lg font-bold">{formatCurrency(data.monthlyTotal)}/mês</p>
    </Link>
  );
}
