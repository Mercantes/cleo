import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockSelect = vi.fn();

function chainable() {
  const chain: Record<string, unknown> = {};
  const methods = ['from', 'select', 'eq', 'gte', 'lte', 'order'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.order = vi.fn().mockImplementation(() => mockSelect());
  return chain;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: () => chainable(),
  }),
}));

describe('GET /api/projections/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/projections/categories/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('returns hasEnoughData false with no transactions', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSelect.mockResolvedValue({ data: [] });

    const { GET } = await import('@/app/api/projections/categories/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasEnoughData).toBe(false);
  });

  it('returns predictions with transaction data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-15`;

    const currentDate = new Date();
    const currentStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-10`;

    mockSelect.mockResolvedValue({
      data: [
        { date: lastMonthStr, amount: 500, type: 'debit', categories: { name: 'Alimentação' } },
        { date: lastMonthStr, amount: 200, type: 'debit', categories: { name: 'Transporte' } },
        { date: currentStr, amount: 300, type: 'debit', categories: { name: 'Alimentação' } },
        { date: currentStr, amount: 100, type: 'debit', categories: { name: 'Transporte' } },
      ],
    });

    const { GET } = await import('@/app/api/projections/categories/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasEnoughData).toBe(true);
    expect(data.predictions.length).toBeGreaterThan(0);
    expect(data.predictions[0]).toHaveProperty('category');
    expect(data.predictions[0]).toHaveProperty('projectedSpending');
    expect(data.predictions[0]).toHaveProperty('status');
  });
});
