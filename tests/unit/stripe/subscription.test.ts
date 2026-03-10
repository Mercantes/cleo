import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSingle = vi.fn();
const mockUpdate = vi.fn();

function chainable(): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    select: () => obj,
    eq: () => obj,
    single: () => mockSingle(),
    update: (data: unknown) => {
      mockUpdate(data);
      return obj;
    },
    insert: () => ({ error: null }),
  };
  return obj;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: () => chainable(),
  })),
}));

const mockCustomersCreate = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    customers: {
      create: (...args: unknown[]) => mockCustomersCreate(...args),
    },
  },
}));

import { getOrCreateCustomer, isInGracePeriod } from '@/lib/stripe/subscription';

describe('getOrCreateCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing customer ID if stored', async () => {
    mockSingle.mockResolvedValue({ data: { stripe_customer_id: 'cus_existing' } });
    const result = await getOrCreateCustomer('user-1', 'test@example.com');
    expect(result).toBe('cus_existing');
    expect(mockCustomersCreate).not.toHaveBeenCalled();
  });

  it('creates new customer when none exists', async () => {
    mockSingle.mockResolvedValue({ data: null });
    mockCustomersCreate.mockResolvedValue({ id: 'cus_new' });

    const result = await getOrCreateCustomer('user-1', 'test@example.com');
    expect(result).toBe('cus_new');
    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: 'test@example.com',
      metadata: { userId: 'user-1' },
    });
  });
});

describe('isInGracePeriod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when no grace period', async () => {
    mockSingle.mockResolvedValue({ data: { grace_period_until: null } });
    const result = await isInGracePeriod('user-1');
    expect(result).toBe(false);
  });

  it('returns true when grace period is in the future', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    mockSingle.mockResolvedValue({ data: { grace_period_until: future.toISOString() } });
    const result = await isInGracePeriod('user-1');
    expect(result).toBe(true);
  });

  it('returns false when grace period has passed', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    mockSingle.mockResolvedValue({ data: { grace_period_until: past.toISOString() } });
    const result = await isInGracePeriod('user-1');
    expect(result).toBe(false);
  });
});
