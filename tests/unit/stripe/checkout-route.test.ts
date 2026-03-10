import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockGetOrCreateCustomer = vi.fn();
vi.mock('@/lib/stripe/subscription', () => ({
  getOrCreateCustomer: (...args: unknown[]) => mockGetOrCreateCustomer(...args),
}));

const mockCheckoutCreate = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutCreate(...args),
      },
    },
  },
}));

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_PRO_PRICE_ID = 'price_test';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/stripe/checkout/route');
    const response = await POST();

    expect(response.status).toBe(401);
  });

  it('creates checkout session and returns URL', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
    });
    mockGetOrCreateCustomer.mockResolvedValue('cus_test');
    mockCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session' });

    const { POST } = await import('@/app/api/stripe/checkout/route');
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://checkout.stripe.com/session');
    expect(mockGetOrCreateCustomer).toHaveBeenCalledWith('user-1', 'test@example.com');
  });
});
