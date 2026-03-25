import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearContextCache } from '@/lib/ai/financial-context';

const mockFrom = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => mockFrom(table),
  })),
}));

function mockTable(data: unknown) {
  return {
    select: () => ({
      eq: () => ({
        single: () => ({ data, error: null }),
        eq: () => ({
          single: () => ({ data, error: null }),
        }),
        gte: () => ({
          lte: () => ({ data: Array.isArray(data) ? data : [], error: null }),
        }),
      }),
    }),
  };
}

describe('buildFinancialContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearContextCache();
  });

  it('builds context with user financial data', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return mockTable({ full_name: 'João' });
      if (table === 'transactions')
        return mockTable([
          { amount: 5000, type: 'credit', categories: { name: 'Receita' } },
          { amount: 1200, type: 'debit', categories: { name: 'Alimentação' } },
        ]);
      if (table === 'recurring_transactions')
        return mockTable([
          { merchant: 'Netflix', amount: 39.9, type: 'subscription', frequency: 'monthly' },
        ]);
      if (table === 'accounts')
        return mockTable([{ name: 'Nubank', balance: 3000, type: 'checking' }]);
      return mockTable(null);
    });

    const { buildFinancialContext } = await import('@/lib/ai/financial-context');
    const context = await buildFinancialContext('user-1');

    expect(context).toContain('João');
    expect(context).toContain('R$\u00a05.000,00');
    expect(context).toContain('R$\u00a01.200,00');
    expect(context).toContain('Alimentação');
  });

  it('handles empty state', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return mockTable({ full_name: null });
      return mockTable([]);
    });

    const { buildFinancialContext } = await import('@/lib/ai/financial-context');
    const context = await buildFinancialContext('user-2');

    expect(context).toContain('Usuário');
    expect(context).toContain('R$\u00a00,00');
  });
});
