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
          gte: () => ({
            lte: () => ({ data: mockData, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

describe('GET /api/dashboard/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = [];
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/dashboard/summary/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/dashboard/summary');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('calculates income, expenses, balance and savings rate', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockData = [
      { amount: 5000, type: 'credit' },
      { amount: 3000, type: 'debit' },
      { amount: 500, type: 'debit' },
    ];

    const { GET } = await import('@/app/api/dashboard/summary/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/dashboard/summary?month=2026-03');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.income).toBe(5000);
    expect(json.expenses).toBe(3500);
    expect(json.balance).toBe(1500);
    expect(json.savingsRate).toBe(30);
    expect(json.month).toBe('2026-03');
  });
});
