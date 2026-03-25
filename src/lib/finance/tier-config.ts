export type Tier = 'free' | 'pro' | 'premium';

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
    chat: 10,
    bank_connections: 1,
  },
  pro: {
    transactions: Infinity,
    chat: 50,
    bank_connections: 3,
  },
  premium: {
    transactions: Infinity,
    chat: Infinity,
    bank_connections: Infinity,
  },
} as const;

/** Returns true if the tier is paid (pro or premium) */
export function isPaidTier(tier: Tier): boolean {
  return tier === 'pro' || tier === 'premium';
}

export function getCurrentPeriod(): string {
  const now = new Date();
  const brDate = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const [year, month] = brDate.split('-');
  return `${year}-${month}`;
}
