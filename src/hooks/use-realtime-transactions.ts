'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mutate } from 'swr';
import { toast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils/format';

/**
 * Subscribes to Supabase Realtime for new transactions.
 * When a new transaction is inserted, invalidates all SWR caches
 * and shows a toast notification.
 */
export function useRealtimeTransactions() {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('realtime-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          const tx = payload.new as {
            description?: string;
            amount?: number;
            type?: string;
            merchant?: string;
          };

          // Invalidate all SWR caches so dashboard/transactions/cashflow refresh
          mutate(() => true, undefined, { revalidate: true });

          // Show toast
          const label = tx.merchant || tx.description || 'Nova transação';
          const amount = tx.amount ? formatCurrency(tx.amount) : '';
          const icon = tx.type === 'credit' ? '💰' : '💳';
          toast.success(`${icon} ${label}${amount ? ` · ${amount}` : ''}`);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'accounts',
        },
        () => {
          // Account balance updated — refresh silently
          mutate(() => true, undefined, { revalidate: true });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);
}
