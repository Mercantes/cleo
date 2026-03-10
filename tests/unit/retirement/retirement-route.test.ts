import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/retirement/route';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockFrom.mockImplementation((table: string) => {
    if (table === 'transactions') {
      return {
        select: () => ({
          eq: () => ({
            gte: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    { date: '2026-01-05', type: 'credit', amount: 5000 },
                    { date: '2026-01-10', type: 'debit', amount: 3000 },
                    { date: '2026-02-05', type: 'credit', amount: 5000 },
                    { date: '2026-02-10', type: 'debit', amount: 3000 },
                  ],
                  error: null,
                }),
            }),
          }),
        }),
      };
    }
    if (table === 'accounts') {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [{ balance: 10000 }], error: null }),
        }),
      };
    }
    return { select: vi.fn() };
  });
});

describe('POST /api/retirement', () => {
  it('returns retirement calculation', async () => {
    const req = new NextRequest('http://localhost/api/retirement', {
      method: 'POST',
      body: JSON.stringify({ targetMonthlyIncome: 5000, annualReturnRate: 0.08, currentPortfolio: 50000 }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.fiNumber).toBe(1500000);
    expect(json.yearsToFI).toBeGreaterThan(0);
    expect(json.scenarios).toHaveLength(3);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const req = new NextRequest('http://localhost/api/retirement', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
