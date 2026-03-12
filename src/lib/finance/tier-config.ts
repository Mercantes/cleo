export type Tier = 'free' | 'pro';

export type TierFeature = 'transactions' | 'chat' | 'bank_connections';

export interface TierCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  tier: Tier;
}

export const TIER_LIMITS: Record<Tier, Record<TierFeature, number>> = {
  free: {
    transactions: 100,
    chat: 30,
    bank_connections: 3,
  },
  pro: {
    transactions: Infinity,
    chat: Infinity,
    bank_connections: Infinity,
  },
} as const;

export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
