import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ data: [], error: null }),
        }),
      }),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      delete: () => ({
        eq: () => ({
          eq: () => ({ error: null }),
        }),
      }),
    }),
  }),
}));

describe('POST /api/budgets - Zod validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('rejects invalid categoryId', async () => {
    const { POST } = await import('@/app/api/budgets/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ categoryId: 'not-a-uuid', monthlyLimit: 500 }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects negative monthlyLimit', async () => {
    const { POST } = await import('@/app/api/budgets/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        monthlyLimit: -100,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects monthlyLimit over 1M', async () => {
    const { POST } = await import('@/app/api/budgets/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        monthlyLimit: 2_000_000,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('accepts valid budget data', async () => {
    mockUpsert.mockReturnValue({
      select: () => ({
        single: () => ({
          data: { id: 'budget-1', category_id: '550e8400-e29b-41d4-a716-446655440000', monthly_limit: 500 },
          error: null,
        }),
      }),
    });

    const { POST } = await import('@/app/api/budgets/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        monthlyLimit: 500,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
