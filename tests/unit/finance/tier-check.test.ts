import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockSingle = vi.fn();
const mockRpc = vi.fn();

function chainable(): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    select: () => obj,
    eq: () => obj,
    single: () => mockSingle(),
    update: () => obj,
    insert: () => ({ error: null }),
    order: () => obj,
    data: null,
    count: 0,
    error: null,
  };
  return obj;
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (...args: unknown[]) => {
      mockFrom(...args);
      return chainable();
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
  })),
}));

import { checkTierLimit, incrementUsage, getUserTier } from '@/lib/finance/tier-check';
import { TIER_LIMITS } from '@/lib/finance/tier-config';

describe('tier-config', () => {
  it('defines correct free tier limits', () => {
    expect(TIER_LIMITS.free.transactions).toBe(100);
    expect(TIER_LIMITS.free.chat).toBe(30);
    expect(TIER_LIMITS.free.bank_connections).toBe(1);
  });

  it('defines pro tier as unlimited', () => {
    expect(TIER_LIMITS.pro.transactions).toBe(Infinity);
    expect(TIER_LIMITS.pro.chat).toBe(Infinity);
    expect(TIER_LIMITS.pro.bank_connections).toBe(Infinity);
  });
});

describe('getUserTier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns free when no profile tier', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    const tier = await getUserTier('user-1');
    expect(tier).toBe('free');
  });

  it('returns pro when profile has pro tier', async () => {
    mockSingle.mockResolvedValue({ data: { tier: 'pro' }, error: null });
    const tier = await getUserTier('user-1');
    expect(tier).toBe('pro');
  });
});

describe('checkTierLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows pro users without checking usage', async () => {
    mockSingle.mockResolvedValue({ data: { tier: 'pro' }, error: null });
    const result = await checkTierLimit('user-1', 'chat');
    expect(result.allowed).toBe(true);
    expect(result.tier).toBe('pro');
  });

  it('allows free user under limit', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { tier: 'free' }, error: null })
      .mockResolvedValueOnce({ data: { count: 5 }, error: null });

    const result = await checkTierLimit('user-1', 'chat');
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(5);
    expect(result.limit).toBe(30);
  });

  it('blocks free user at limit', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { tier: 'free' }, error: null })
      .mockResolvedValueOnce({ data: { count: 30 }, error: null });

    const result = await checkTierLimit('user-1', 'chat');
    expect(result.allowed).toBe(false);
    expect(result.current).toBe(30);
  });

  it('returns 0 current when no usage record', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { tier: 'free' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const result = await checkTierLimit('user-1', 'transactions');
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(0);
  });
});

describe('incrementUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not increment for bank_connections', async () => {
    await incrementUsage('user-1', 'bank_connections');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('calls atomic rpc for chat usage', async () => {
    mockRpc.mockResolvedValue({ data: 6, error: null });
    await incrementUsage('user-1', 'chat');
    expect(mockRpc).toHaveBeenCalledWith(
      'increment_usage',
      expect.objectContaining({
        p_user_id: 'user-1',
        p_feature: 'chat',
      }),
    );
  });
});
