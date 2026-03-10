import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOr = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: { id: 'user-123' } } })) },
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

describe('GET /api/transactions/uncategorized', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const terminal = Promise.resolve({ data: [], error: null, count: 0 });
    mockRange.mockReturnValue(terminal);
    mockOrder.mockReturnValue({ range: mockRange });
    mockOr.mockReturnValue({ order: mockOrder });
    mockEq.mockReturnValue({ or: mockOr });
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  it('should return 401 if not authenticated', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: vi.fn(() => ({ data: { user: null } })) },
    } as never);

    const { GET } = await import('@/app/api/transactions/uncategorized/route');
    const req = new NextRequest('http://localhost/api/transactions/uncategorized');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('should return uncategorized transactions', async () => {
    const { GET } = await import('@/app/api/transactions/uncategorized/route');
    const req = new NextRequest('http://localhost/api/transactions/uncategorized');
    const res = await GET(req);
    const body = await res.json();

    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
    expect(mockOr).toHaveBeenCalledWith('category_id.is.null,category_confidence.lt.0.70');
  });
});
