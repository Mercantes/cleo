import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockCheckTierLimit = vi.fn();
vi.mock('@/lib/finance/tier-check', () => ({
  checkTierLimit: (...args: unknown[]) => mockCheckTierLimit(...args),
}));

describe('GET /api/tier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/tier/route');
    const response = await GET(new NextRequest('http://localhost'));

    expect(response.status).toBe(401);
  });

  it('returns usage for all features', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockCheckTierLimit.mockResolvedValue({
      allowed: true,
      current: 5,
      limit: 100,
      tier: 'free',
    });

    const { GET } = await import('@/app/api/tier/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.usage).toHaveLength(3);
    expect(data.usage[0].feature).toBe('transactions');
    expect(mockCheckTierLimit).toHaveBeenCalledTimes(3);
  });
});
