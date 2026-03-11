import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockDelete = vi.fn();

function chainable(terminalFn: () => unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'lt', 'order', 'limit', 'delete'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.limit = vi.fn().mockImplementation(() => terminalFn());
  chain.delete = vi.fn().mockReturnValue({
    eq: vi.fn().mockImplementation(() => mockDelete()),
  });
  return chain;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: () => chainable(() => mockSelect()),
  }),
}));

describe('GET /api/chat/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/chat/history/route');
    const request = new Request('http://localhost/api/chat/history');
    const response = await GET(request as never);

    expect(response.status).toBe(401);
  });

  it('returns messages for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSelect.mockResolvedValue({
      data: [
        { id: '1', role: 'user', content: 'hello', created_at: '2026-01-01' },
      ],
    });

    const { GET } = await import('@/app/api/chat/history/route');
    const url = new URL('http://localhost/api/chat/history');
    const request = { nextUrl: url } as never;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.messages).toHaveLength(1);
  });
});

describe('DELETE /api/chat/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { DELETE } = await import('@/app/api/chat/history/route');
    const response = await DELETE();

    expect(response.status).toBe(401);
  });

  it('deletes messages for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockDelete.mockResolvedValue({ error: null });

    const { DELETE } = await import('@/app/api/chat/history/route');
    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
