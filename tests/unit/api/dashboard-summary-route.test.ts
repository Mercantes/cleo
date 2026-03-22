import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Chainable mock for Supabase query builder
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

describe('GET /api/dashboard/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/dashboard/summary/route');
    const response = await GET(new NextRequest('http://localhost/api/dashboard/summary'));

    expect(response.status).toBe(401);
  });

  it('returns summary data with correct calculations', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const currentTransactions = [
      { amount: 5000, type: 'credit' },
      { amount: 3000, type: 'credit' },
      { amount: 2000, type: 'debit' },
      { amount: 1000, type: 'debit' },
    ];
    const prevTransactions = [
      { amount: 4000, type: 'credit' },
      { amount: 1500, type: 'debit' },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({ data: currentTransactions, error: null });
      }
      return chainable({ data: prevTransactions, error: null });
    });

    const { GET } = await import('@/app/api/dashboard/summary/route');
    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/summary?month=2026-03'),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    // income = 5000 + 3000 = 8000
    expect(data.income).toBe(8000);
    // expenses = 2000 + 1000 = 3000
    expect(data.expenses).toBe(3000);
    // balance = 8000 - 3000 = 5000
    expect(data.balance).toBe(5000);
    // savingsRate = round((8000 - 3000) / 8000 * 1000) / 10 = 62.5
    expect(data.savingsRate).toBe(62.5);
    // prevExpenses = 1500, percentChange = round((3000 - 1500) / 1500 * 1000) / 10 = 100
    expect(data.percentChange).toBe(100);
    expect(data.prevExpenses).toBe(1500);
    expect(data.prevIncome).toBe(4000);
    expect(data.month).toBe('2026-03');
  });

  it('returns 500 when query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({ data: null, error: { message: 'DB error' } });
      }
      return chainable({ data: [], error: null });
    });

    const { GET } = await import('@/app/api/dashboard/summary/route');
    const response = await GET(new NextRequest('http://localhost/api/dashboard/summary'));

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });
});
