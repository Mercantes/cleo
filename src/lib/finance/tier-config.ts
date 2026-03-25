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
  const brDate = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const [year, month] = brDate.split('-');
  return `${year}-${month}`;
}
