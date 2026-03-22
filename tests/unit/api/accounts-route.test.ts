import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Chainable mock for Supabase query builder
function chainable(resolveValue?: unknown) {
  const chain: Record<string, unknown> = {};
  const handler = {
    get(_target: unknown, prop: string) {
      if (prop === 'then') {
        if (resolveValue !== undefined) {
          return (resolve: (v: unknown) => void) => resolve(resolveValue);
        }
        return undefined;
      }
      if (!chain[prop]) {
        chain[prop] = new Proxy(vi.fn(() => new Proxy({}, handler)), handler);
      }
      return chain[prop];
    },
  };
  return new Proxy({}, handler);
}

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

vi.mock('@/lib/utils/api-rate-limit', () => ({
  checkRateLimit: () => null,
}));

describe('GET /api/accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/accounts/route');
    const response = await GET(new NextRequest('http://localhost/api/accounts'));

    expect(response.status).toBe(401);
  });

  it('returns accounts and connections data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const accounts = [
      {
        id: 'acc-1',
        name: 'Checking Account',
        type: 'checking',
        balance: 5000,
        currency: 'BRL',
        bank_connection_id: 'conn-1',
        bank_connections: {
          id: 'conn-1',
          connector_name: 'Nubank',
          connector_logo_url: 'https://logo.nubank.png',
        },
      },
      {
        id: 'acc-2',
        name: 'Credit Card',
        type: 'credit',
        balance: -1500,
        currency: 'BRL',
        bank_connection_id: 'conn-1',
        bank_connections: {
          id: 'conn-1',
          connector_name: 'Nubank',
          connector_logo_url: 'https://logo.nubank.png',
        },
      },
    ];

    const connections = [
      {
        id: 'conn-1',
        connector_name: 'Nubank',
        connector_logo_url: 'https://logo.nubank.png',
        status: 'active',
        last_sync_at: '2026-03-20T10:00:00Z',
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'accounts') {
        return chainable({ data: accounts, error: null });
      }
      if (table === 'bank_connections') {
        return chainable({ data: connections, error: null });
      }
      return chainable({ data: [], error: null });
    });

    const { GET } = await import('@/app/api/accounts/route');
    const response = await GET(new NextRequest('http://localhost/api/accounts'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.bankAccounts).toHaveLength(1);
    expect(data.bankAccounts[0].name).toBe('Checking Account');
    expect(data.bankAccounts[0].bankName).toBe('Nubank');
    expect(data.bankAccounts[0].bankLogo).toBe('https://logo.nubank.png');
    expect(data.creditCards).toHaveLength(1);
    expect(data.creditCards[0].name).toBe('Credit Card');
    expect(data.bankTotal).toBe(5000);
    expect(data.creditTotal).toBe(-1500);
    expect(data.connections).toHaveLength(1);
    expect(data.connections[0].connectorName).toBe('Nubank');
    expect(data.connections[0].accountCount).toBe(2);
  });

  it('returns 500 when accounts query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'accounts') {
        return chainable({ data: null, error: { message: 'DB error' } });
      }
      return chainable({ data: [], error: null });
    });

    const { GET } = await import('@/app/api/accounts/route');
    const response = await GET(new NextRequest('http://localhost/api/accounts'));

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });

  it('returns empty arrays when no data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    mockFrom.mockImplementation(() => {
      return chainable({ data: [], error: null });
    });

    const { GET } = await import('@/app/api/accounts/route');
    const response = await GET(new NextRequest('http://localhost/api/accounts'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.creditCards).toEqual([]);
    expect(data.bankAccounts).toEqual([]);
    expect(data.connections).toEqual([]);
    expect(data.creditTotal).toBe(0);
    expect(data.bankTotal).toBe(0);
  });
});
