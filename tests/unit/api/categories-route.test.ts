import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

vi.mock('@/lib/utils/api-rate-limit', () => ({
  checkRateLimit: () => null,
}));

function chainable(resolveValue?: unknown) {
  const chain: Record<string, unknown> = {};
  const handler = {
    get(_target: unknown, prop: string) {
      if (prop === 'then') {
        if (resolveValue !== undefined) {
          return (resolve: (v: unknown) => void) => resolve(resolveValue);
        }
        return undefined;
      }
      if (!chain[prop]) {
        chain[prop] = new Proxy(vi.fn(() => new Proxy({}, handler)), handler);
      }
      return chain[prop];
    },
  };
  return new Proxy({}, handler);
}

describe('GET /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/categories/route');
    const response = await GET(new NextRequest('http://localhost'));

    expect(response.status).toBe(401);
  });

  it('returns categories list successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const categories = [
      { id: '1', name: 'Alimentação', icon: 'utensils' },
      { id: '2', name: 'Transporte', icon: 'car' },
    ];
    mockFrom.mockReturnValue(chainable({ data: categories, error: null }));

    const { GET } = await import('@/app/api/categories/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.categories).toEqual(categories);
  });

  it('returns 500 when database query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFrom.mockReturnValue(chainable({ data: null, error: { message: 'DB error' } }));

    const { GET } = await import('@/app/api/categories/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('returns empty array when no categories', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFrom.mockReturnValue(chainable({ data: [], error: null }));

    const { GET } = await import('@/app/api/categories/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.categories).toEqual([]);
  });
});
