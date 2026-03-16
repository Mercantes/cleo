import { useApi } from '@/hooks/use-api';

interface UsageData {
  tier: 'free' | 'pro';
  transactions: { current: number; limit: number };
  chat: { current: number; limit: number };
}

export function useTier() {
  const { data, isLoading } = useApi<UsageData>('/api/usage');
  return {
    tier: data?.tier ?? 'free',
    isPro: data?.tier === 'pro',
    isLoading,
  };
}
