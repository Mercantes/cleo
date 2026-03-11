import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    }),
}));

// Mock Pluggy client
const mockCreateConnectToken = vi.fn();
vi.mock('@/lib/pluggy/client', () => ({
  createConnectToken: (...args: unknown[]) => mockCreateConnectToken(...args),
}));

// Mock tier check
vi.mock('@/lib/finance/tier-check', () => ({
  checkTierLimit: vi.fn().mockResolvedValue({ allowed: true, current: 0, limit: 1, tier: 'free' }),
}));

import { POST } from '@/app/api/pluggy/connect-token/route';

function createRequest(body?: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/pluggy/connect-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/pluggy/connect-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(createRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return accessToken on success', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
    mockCreateConnectToken.mockResolvedValue({ accessToken: 'connect-token-abc' });

    const response = await POST(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.accessToken).toBe('connect-token-abc');
  });

  it('should pass itemId for reconnection', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
    mockCreateConnectToken.mockResolvedValue({ accessToken: 'reconnect-token' });

    await POST(createRequest({ itemId: 'item-123' }));

    expect(mockCreateConnectToken).toHaveBeenCalledWith('item-123');
  });

  it('should handle Pluggy errors', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });

    const { PluggyError } = await import('@/lib/pluggy/types');
    mockCreateConnectToken.mockRejectedValue(new PluggyError('API error', 502));

    const response = await POST(createRequest());
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toContain('Failed to connect to bank');
  });
});
