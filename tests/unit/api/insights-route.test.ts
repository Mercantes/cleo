import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockFrom = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => mockFrom(table),
  }),
}));

function chainable(resolvedValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'gte', 'lte', 'order', 'limit', 'in', 'single'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Last method in chain returns the resolved value
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  chain.lte = vi.fn().mockResolvedValue(resolvedValue);
  return chain;
}

describe('GET /api/insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/insights/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('returns insights array', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    // Mock all tables
    mockFrom.mockImplementation((table: string) => {
      if (table === 'transactions') {
        return chainable({ data: [] });
      }
      if (table === 'recurring_transactions') {
        return chainable({ data: [] });
      }
      if (table === 'goals') {
        return chainable({ data: null });
      }
      return chainable({ data: null });
    });

    const { GET } = await import('@/app/api/insights/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('insights');
    expect(Array.isArray(data.insights)).toBe(true);
  });
});
