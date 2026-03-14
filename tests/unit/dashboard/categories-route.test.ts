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
          eq: () => ({
            gte: () => ({
              lte: () => ({ data: mockData, error: null }),
            }),
          }),
        }),
      }),
    }),
  }),
}));

describe('GET /api/dashboard/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = [];
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/dashboard/categories/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/dashboard/categories');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('groups top 5 categories and remainder as Outros', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockData = [
      { amount: 1000, categories: { name: 'Alimentação' } },
      { amount: 800, categories: { name: 'Transporte' } },
      { amount: 600, categories: { name: 'Moradia' } },
      { amount: 400, categories: { name: 'Saúde' } },
      { amount: 300, categories: { name: 'Lazer' } },
      { amount: 200, categories: { name: 'Educação' } },
      { amount: 100, categories: { name: 'Compras' } },
    ];

    const { GET } = await import('@/app/api/dashboard/categories/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/dashboard/categories?month=2026-03');
    const response = await GET(request);
    const json = await response.json();

    expect(json.categories).toHaveLength(6); // top 5 + Outros
    expect(json.categories[0].name).toBe('Alimentação');
    expect(json.categories[5].name).toBe('Demais');
    expect(json.categories[5].amount).toBe(300); // 200 + 100
  });
});
