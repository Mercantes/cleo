import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Pluggy client
const mockGetTransactions = vi.fn();
vi.mock('@/lib/pluggy/client', () => ({
  getAccounts: vi.fn(),
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
}));

// Mock Supabase client
const mockSelect = vi.fn();
const mockUpsert = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'accounts') {
        return {
          select: () => ({
            eq: mockSelect,
          }),
        };
      }
      if (table === 'transactions') {
        return {
          upsert: mockUpsert,
        };
      }
      return {};
    },
  }),
}));

import { syncTransactions } from '@/lib/pluggy/sync';

describe('syncTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('should return empty result when no accounts', async () => {
    mockSelect.mockResolvedValue({ data: [] });

    const result = await syncTransactions('user-1', 'conn-1', 'item-1');

    expect(result).toEqual({ imported: 0, skipped: 0, errors: 0 });
  });

  it('should sync transactions from Pluggy and save to DB', async () => {
    mockSelect.mockResolvedValue({
      data: [{ id: 'db-acc-1', pluggy_account_id: 'pluggy-acc-1' }],
    });

    mockGetTransactions.mockResolvedValue([
      {
        id: 'tx-1',
        description: 'IFOOD *IFOOD',
        amount: -45.9,
        date: '2026-03-01T00:00:00Z',
        type: 'DEBIT',
        category: 'Food',
        paymentData: { receiver: { name: 'iFood' } },
        creditCardMetadata: null,
      },
      {
        id: 'tx-2',
        description: 'SALARIO',
        amount: 5000,
        date: '2026-03-05T00:00:00Z',
        type: 'CREDIT',
        category: null,
        paymentData: null,
        creditCardMetadata: null,
      },
    ]);

    mockUpsert.mockReturnValue({
      select: () => Promise.resolve({ data: [{ id: 'a' }, { id: 'b' }], error: null }),
    });

    const result = await syncTransactions('user-1', 'conn-1', 'item-1');

    expect(result.imported).toBe(2);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          pluggy_transaction_id: 'tx-1',
          description: 'IFOOD *IFOOD',
          amount: 45.9, // absolute value
          type: 'debit',
          merchant: 'iFood',
        }),
        expect.objectContaining({
          pluggy_transaction_id: 'tx-2',
          type: 'credit',
          merchant: null,
        }),
      ]),
      expect.objectContaining({ ignoreDuplicates: true }),
    );
  });

  it('should handle deduplication (skipped count)', async () => {
    mockSelect.mockResolvedValue({
      data: [{ id: 'db-acc-1', pluggy_account_id: 'pluggy-acc-1' }],
    });

    mockGetTransactions.mockResolvedValue([
      { id: 'tx-1', description: 'Test', amount: 10, date: '2026-03-01', type: 'DEBIT', category: null, paymentData: null, creditCardMetadata: null },
      { id: 'tx-2', description: 'Test2', amount: 20, date: '2026-03-01', type: 'DEBIT', category: null, paymentData: null, creditCardMetadata: null },
    ]);

    // Only 1 was actually inserted (1 was duplicate)
    mockUpsert.mockReturnValue({
      select: () => Promise.resolve({ data: [{ id: 'a' }], error: null }),
    });

    const result = await syncTransactions('user-1', 'conn-1', 'item-1');

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('should handle errors gracefully', async () => {
    mockSelect.mockResolvedValue({
      data: [{ id: 'db-acc-1', pluggy_account_id: 'pluggy-acc-1' }],
    });

    mockGetTransactions.mockRejectedValue(new Error('Network error'));

    const result = await syncTransactions('user-1', 'conn-1', 'item-1');

    expect(result.errors).toBe(1);
  });
});
