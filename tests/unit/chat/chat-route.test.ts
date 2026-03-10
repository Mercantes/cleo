import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => ({
            data: { id: 'msg-1', role: 'user', content: 'test', created_at: '2026-03-10' },
          }),
        }),
      }),
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock('@/lib/finance/tier-check', () => ({
  checkTierLimit: vi.fn().mockResolvedValue({ allowed: true, current: 1, limit: 30, tier: 'free' }),
  incrementUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/ai/financial-context', () => ({
  buildFinancialContext: vi.fn().mockResolvedValue('Mock context'),
}));

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = {
      stream: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } };
        },
      }),
    };
  }
  return { default: MockAnthropic };
});

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/chat/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when message is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const { POST } = await import('@/app/api/chat/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 403 when tier limit reached', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const { checkTierLimit } = await import('@/lib/finance/tier-check');
    vi.mocked(checkTierLimit).mockResolvedValueOnce({ allowed: false, current: 30, limit: 30, tier: 'free' });

    const { POST } = await import('@/app/api/chat/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });
});
