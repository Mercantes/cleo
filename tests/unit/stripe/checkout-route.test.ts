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
const mockSubscriptionsList = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutCreate(...args),
      },
    },
    subscriptions: {
      list: (...args: unknown[]) => mockSubscriptionsList(...args),
    },
  },
}));

function makeRequest(origin?: string, host?: string) {
  const headers: Record<string, string> = {};
  if (origin) headers.origin = origin;
  if (host) headers.host = host;
  return new Request('http://localhost:3000/api/stripe/checkout', {
    method: 'POST',
    headers,
  }) as unknown as import('next/server').NextRequest;
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_PRO_PRICE_ID = 'price_test';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/stripe/checkout/route');
    const response = await POST(makeRequest('http://localhost:3000'));

    expect(response.status).toBe(401);
  });

  it('returns 403 for invalid origin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } } });
    mockSubscriptionsList.mockResolvedValue({ data: [] });
    const { POST } = await import('@/app/api/stripe/checkout/route');
    const response = await POST(makeRequest('http://evil.com', 'legit.example.com'));

    expect(response.status).toBe(403);
  });

  it('creates checkout session and returns URL', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
    });
    mockGetOrCreateCustomer.mockResolvedValue('cus_test');
    mockSubscriptionsList.mockResolvedValue({ data: [] });
    mockCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session' });

    const { POST } = await import('@/app/api/stripe/checkout/route');
    const response = await POST(makeRequest('http://localhost:3000'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://checkout.stripe.com/session');
    expect(mockGetOrCreateCustomer).toHaveBeenCalledWith('user-1', 'test@example.com');
  });
});
