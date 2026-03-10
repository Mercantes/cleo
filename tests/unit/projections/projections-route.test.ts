import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/projections/route';

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

describe('GET /api/projections', () => {
  it('returns projection data with scenarios', async () => {
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.hasEnoughData).toBe(true);
    expect(json.scenarios).toHaveLength(3);
    expect(json.currentBalance).toBe(10000);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
