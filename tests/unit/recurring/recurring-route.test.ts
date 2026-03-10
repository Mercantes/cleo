import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => ({
      select: () => {
        mockSelect();
        return {
          eq: (col: string, val: string) => {
            mockEq(col, val);
            return {
              eq: (col2: string, val2: string) => {
                mockEq(col2, val2);
                return {
                  order: (col3: string, opts: Record<string, unknown>) => {
                    mockOrder(col3, opts);
                    return { data: mockData, error: null };
                  },
                };
              },
            };
          },
        };
      },
    }),
  }),
}));

let mockData: Record<string, unknown>[] = [];

describe('GET /api/recurring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = [];
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/recurring/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns subscriptions, installments and monthlyTotal', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockData = [
      { id: '1', type: 'subscription', amount: 39.9, merchant: 'Netflix' },
      { id: '2', type: 'installment', amount: 150, merchant: 'Loja' },
    ];

    const { GET } = await import('@/app/api/recurring/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.subscriptions).toHaveLength(1);
    expect(json.installments).toHaveLength(1);
    expect(json.monthlyTotal).toBe(189.9);
  });
});
