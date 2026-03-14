import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSelect = vi.fn();

function chainable() {
  const chain: Record<string, unknown> = {};
  const methods = ['from', 'select', 'eq', 'gte', 'lte', 'order', 'range', 'limit'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lte = vi.fn().mockImplementation(() => mockSelect());
  return chain;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: () => chainable(),
  }),
}));

describe('GET /api/dashboard/trends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/dashboard/trends/route');
    const response = await GET(new NextRequest('http://localhost'));

    expect(response.status).toBe(401);
  });

  it('returns 6 months of trend data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSelect.mockResolvedValue({
      data: [
        { amount: 5000, type: 'credit' },
        { amount: 3000, type: 'debit' },
      ],
    });

    const { GET } = await import('@/app/api/dashboard/trends/route');
    const response = await GET(new NextRequest('http://localhost'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.months).toHaveLength(6);
    expect(data.months[0]).toHaveProperty('income');
    expect(data.months[0]).toHaveProperty('expenses');
    expect(data.months[0]).toHaveProperty('label');
  });
});
