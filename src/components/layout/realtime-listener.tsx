'use client';

import { useRealtimeTransactions } from '@/hooks/use-realtime-transactions';

export function RealtimeListener() {
  useRealtimeTransactions();
  return null;
}
