'use client';

import { useEffect } from 'react';
import { useApi } from '@/hooks/use-api';

const TIER_CACHE_KEY = 'cleo:tier-cache';

interface UsageData {
  tier: 'free' | 'pro';
  transactions: { current: number; limit: number };
  chat: { current: number; limit: number };
}

function getCachedTier(): 'free' | 'pro' {
  if (typeof window === 'undefined') return 'free';
  try {
    const cached = localStorage.getItem(TIER_CACHE_KEY);
    if (cached === 'pro' || cached === 'free') return cached;
  } catch {
    // localStorage unavailable
  }
  return 'free';
}

/** Clear tier cache on logout to prevent cross-account leakage */
export function clearTierCache() {
  try {
    localStorage.removeItem(TIER_CACHE_KEY);
  } catch {
    // localStorage unavailable
  }
}

export function useTier() {
  const { data, isLoading } = useApi<UsageData>('/api/usage');

  useEffect(() => {
    if (data?.tier) {
      try {
        localStorage.setItem(TIER_CACHE_KEY, data.tier);
      } catch {
        // localStorage unavailable
      }
    }
  }, [data?.tier]);

  const tier = data?.tier ?? getCachedTier();

  return {
    tier,
    isPro: tier === 'pro',
    isLoading,
  };
}
