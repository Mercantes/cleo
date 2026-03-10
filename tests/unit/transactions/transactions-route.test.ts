import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockOr = vi.fn();

const mockUser = { id: 'user-123' };

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: mockUser } })) },
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

function setupChain(data: unknown[] = [], count = 0, error: null | { message: string } = null) {
  const terminal = Promise.resolve({ data, error, count });
  mockOr.mockReturnValue(terminal);
  mockLte.mockReturnValue({ or: mockOr, then: (terminal as Promise<unknown>).then.bind(terminal) });
  mockGte.mockReturnValue({ lte: mockLte, or: mockOr, then: (terminal as Promise<unknown>).then.bind(terminal) });
  mockRange.mockReturnValue({ eq: mockEq, gte: mockGte, lte: mockLte, or: mockOr, then: (terminal as Promise<unknown>).then.bind(terminal) });
  mockOrder.mockReturnValue({ range: mockRange });
  mockEq.mockReturnValue({ order: mockOrder, eq: mockEq, gte: mockGte, lte: mockLte, or: mockOr, then: (terminal as Promise<unknown>).then.bind(terminal) });
  mockSelect.mockReturnValue({ eq: mockEq });
}

describe('GET /api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated transactions', async () => {
    const txs = [{ id: '1', description: 'Test', amount: 100 }];
    setupChain(txs, 1);

    const { GET } = await import('@/app/api/transactions/route');
    const req = new NextRequest('http://localhost/api/transactions?page=1');
    const res = await GET(req);
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(50);
  });

  it('should return 401 if not authenticated', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: vi.fn(() => ({ data: { user: null } })) },
    } as never);

    const { GET } = await import('@/app/api/transactions/route');
    const req = new NextRequest('http://localhost/api/transactions');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('should apply search filter', async () => {
    setupChain([], 0);

    const { GET } = await import('@/app/api/transactions/route');
    const req = new NextRequest('http://localhost/api/transactions?search=mercado');
    await GET(req);

    expect(mockOr).toHaveBeenCalled();
  });

  it('should return 500 on database error', async () => {
    setupChain(null as never, 0, { message: 'DB error' });

    const { GET } = await import('@/app/api/transactions/route');
    const req = new NextRequest('http://localhost/api/transactions');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
