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

const mockCategorize = vi.fn();
vi.mock('@/lib/ai/categorize', () => ({
  categorizeTransactions: (...args: unknown[]) => mockCategorize(...args),
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

describe('POST /api/transactions/recategorize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/transactions/recategorize/route');
    const response = await POST(new NextRequest('http://localhost/api/transactions/recategorize', { method: 'POST' }));

    expect(response.status).toBe(401);
  });

  it('returns { categorized: 0, total: 0 } when no uncategorized transactions', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFrom.mockReturnValue(chainable({ data: [], error: null }));

    const { POST } = await import('@/app/api/transactions/recategorize/route');
    const response = await POST(new NextRequest('http://localhost/api/transactions/recategorize', { method: 'POST' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ categorized: 0, total: 0 });
  });

  it('calls categorizeTransactions and returns count', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const transactions = [
      { id: 'tx-1', description: 'Uber trip', amount: 25, type: 'debit' },
      { id: 'tx-2', description: 'Netflix', amount: 40, type: 'debit' },
    ];
    mockFrom.mockReturnValue(chainable({ data: transactions, error: null }));
    mockCategorize.mockResolvedValue(2);

    const { POST } = await import('@/app/api/transactions/recategorize/route');
    const response = await POST(new NextRequest('http://localhost/api/transactions/recategorize', { method: 'POST' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCategorize).toHaveBeenCalledWith(transactions);
    expect(data).toEqual({ categorized: 2, total: 2 });
  });

  it('returns 500 on query error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFrom.mockReturnValue(chainable({ data: null, error: { message: 'DB failure' } }));

    const { POST } = await import('@/app/api/transactions/recategorize/route');
    const response = await POST(new NextRequest('http://localhost/api/transactions/recategorize', { method: 'POST' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
