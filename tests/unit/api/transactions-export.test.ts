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
          order: () => ({
            limit: () => ({ data: mockData, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

describe('GET /api/transactions/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockData = [];
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/transactions/export/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/transactions/export');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns CSV with BOM and semicolon separator', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'export-test-user' } } });
    mockData = [
      {
        date: '2026-03-10',
        description: 'Supermercado Extra',
        merchant: 'Extra',
        amount: 150.5,
        type: 'debit',
        categories: { name: 'Alimentação' },
      },
      {
        date: '2026-03-09',
        description: 'Salário',
        merchant: null,
        amount: 5000,
        type: 'credit',
        categories: null,
      },
    ];

    const { GET } = await import('@/app/api/transactions/export/route');
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/transactions/export');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const buf = await response.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buf);
    // BOM is \uFEFF = 0xEF 0xBB 0xBF in UTF-8
    const bytes = new Uint8Array(buf);
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);
    expect(text).toContain('Data;Descrição;Comerciante;Valor;Tipo;Categoria');
    expect(text).toContain('Supermercado Extra;Extra;150,50;Despesa;Alimentação');
    expect(text).toContain('Salário;;5000,00;Receita;Sem categoria');
    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
  });
});
