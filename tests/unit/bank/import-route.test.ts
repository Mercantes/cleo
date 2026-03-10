import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockGetUser = vi.fn();
const mockUpsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    }),
}));

// Mock Pluggy client
const mockGetItem = vi.fn();
const mockGetAccounts = vi.fn();
vi.mock('@/lib/pluggy/client', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  getAccounts: (...args: unknown[]) => mockGetAccounts(...args),
}));

// Mock sync and categorize
vi.mock('@/lib/pluggy/sync', () => ({
  syncTransactions: () => Promise.resolve({ imported: 5, skipped: 0, errors: 0 }),
}));

vi.mock('@/lib/ai/categorize', () => ({
  categorizeTransactions: () => Promise.resolve(3),
}));

import { POST } from '@/app/api/pluggy/import/route';

function createRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/pluggy/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/pluggy/import', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain for bank_connections upsert
    mockSingle.mockResolvedValue({
      data: { id: 'conn-1', user_id: 'user-1', pluggy_item_id: 'item-1' },
      error: null,
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockUpsert.mockReturnValue({ select: mockSelect });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'bank_connections') {
        return { upsert: mockUpsert };
      }
      if (table === 'accounts') {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              is: () => ({
                limit: () => Promise.resolve({ data: [{ id: 'tx-1', description: 'Test', amount: 10, type: 'debit' }] }),
              }),
            }),
          }),
        };
      }
      return {};
    });
  });

  it('should return 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(createRequest({ itemId: 'item-1' }));

    expect(response.status).toBe(401);
  });

  it('should return 400 if itemId is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('itemId is required');
  });

  it('should import bank connection and accounts', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockGetItem.mockResolvedValue({
      id: 'item-1',
      status: 'UPDATED',
      connector: { id: 1, name: 'Banco do Brasil' },
    });
    mockGetAccounts.mockResolvedValue([
      { id: 'acc-1', name: 'Conta Corrente', type: 'BANK', subtype: 'CHECKING_ACCOUNT', balance: 1500, currencyCode: 'BRL' },
      { id: 'acc-2', name: 'Poupança', type: 'BANK', subtype: 'SAVINGS_ACCOUNT', balance: 5000, currencyCode: 'BRL' },
    ]);

    const response = await POST(createRequest({ itemId: 'item-1' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.connectionId).toBe('conn-1');
    expect(data.accountCount).toBe(2);
  });

  it('should handle duplicate itemId by upserting', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockGetItem.mockResolvedValue({
      id: 'item-1',
      status: 'UPDATED',
      connector: { id: 1, name: 'Nubank' },
    });
    mockGetAccounts.mockResolvedValue([]);

    await POST(createRequest({ itemId: 'item-1' }));

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ pluggy_item_id: 'item-1' }),
      { onConflict: 'pluggy_item_id' },
    );
  });
});
