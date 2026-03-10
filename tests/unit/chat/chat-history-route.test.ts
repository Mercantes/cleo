import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
let mockData: Record<string, unknown>[] = [];

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              data: mockData,
              error: null,
            }),
          }),
        }),
      }),
    }),
  }),
}));

describe('GET /api/chat/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = [];
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/chat/history/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/chat/history');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns messages in chronological order', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockData = [
      { id: '2', role: 'assistant', content: 'Olá!', created_at: '2026-03-10T10:01:00Z' },
      { id: '1', role: 'user', content: 'Oi', created_at: '2026-03-10T10:00:00Z' },
    ];

    const { GET } = await import('@/app/api/chat/history/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/chat/history');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.messages).toHaveLength(2);
    // Route reverses DESC results to chronological
    expect(json.messages[0].id).toBe('1');
    expect(json.messages[1].id).toBe('2');
  });
});
