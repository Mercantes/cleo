import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockCheckTierLimit = vi.fn();
const mockIncrementUsage = vi.fn();

vi.mock('@/lib/finance/tier-check', () => ({
  checkTierLimit: (...args: unknown[]) => mockCheckTierLimit(...args),
  incrementUsage: (...args: unknown[]) => mockIncrementUsage(...args),
}));

import { withTierCheck } from '@/lib/utils/tier-middleware';

describe('withTierCheck middleware', () => {
  const mockHandler = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
    mockHandler.mockResolvedValue(new Response('ok', { status: 200 }));
    mockIncrementUsage.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const wrapped = withTierCheck('chat', mockHandler);
    const request = new NextRequest('http://localhost/api/test');
    const response = await wrapped(request);

    expect(response.status).toBe(401);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('returns 403 when tier limit reached', async () => {
    mockCheckTierLimit.mockResolvedValue({
      allowed: false,
      current: 30,
      limit: 30,
      tier: 'free',
    });

    const wrapped = withTierCheck('chat', mockHandler);
    const request = new NextRequest('http://localhost/api/test');
    const response = await wrapped(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('TIER_LIMIT_REACHED');
    expect(data.upgradeUrl).toBe('/upgrade');
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('calls handler and increments usage when allowed', async () => {
    mockCheckTierLimit.mockResolvedValue({
      allowed: true,
      current: 5,
      limit: 30,
      tier: 'free',
    });

    const wrapped = withTierCheck('chat', mockHandler);
    const request = new NextRequest('http://localhost/api/test');
    const response = await wrapped(request);

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
    expect(mockIncrementUsage).toHaveBeenCalledWith('user-1', 'chat');
  });

  it('does not increment usage on error response', async () => {
    mockCheckTierLimit.mockResolvedValue({
      allowed: true,
      current: 5,
      limit: 30,
      tier: 'free',
    });
    mockHandler.mockResolvedValue(new Response('error', { status: 500 }));

    const wrapped = withTierCheck('chat', mockHandler);
    const request = new NextRequest('http://localhost/api/test');
    await wrapped(request);

    expect(mockIncrementUsage).not.toHaveBeenCalled();
  });
});
