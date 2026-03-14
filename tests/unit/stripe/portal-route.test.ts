import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockServiceSelect = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => mockServiceSelect(),
        }),
      }),
    }),
  }),
}));

const mockPortalCreate = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: (...args: unknown[]) => mockPortalCreate(...args),
      },
    },
  },
}));

describe('GET /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/stripe/portal/route');
    const response = await GET(new NextRequest('http://localhost'));

    expect(response.status).toBe(401);
  });

  it('returns 404 when no stripe customer', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockServiceSelect.mockResolvedValue({ data: null });

    const { GET } = await import('@/app/api/stripe/portal/route');
    const response = await GET(new NextRequest('http://localhost'));

    expect(response.status).toBe(404);
  });

  it('returns portal URL for active customer', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockServiceSelect.mockResolvedValue({
      data: { stripe_customer_id: 'cus_test' },
    });
    mockPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/session' });

    const { GET } = await import('@/app/api/stripe/portal/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://billing.stripe.com/session');
  });
});
