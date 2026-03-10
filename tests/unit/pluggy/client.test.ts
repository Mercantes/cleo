import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env before importing client
vi.mock('@/lib/env', () => ({
  getPluggyConfig: () => ({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  }),
}));

import {
  authenticate,
  createConnectToken,
  getItem,
  getAccounts,
  getTransactions,
  _resetTokenCache,
} from '@/lib/pluggy/client';
import { PluggyError } from '@/lib/pluggy/types';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

describe('Pluggy Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetTokenCache();
  });

  describe('authenticate', () => {
    it('should authenticate and return apiKey', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'test-token' }));

      const token = await authenticate();

      expect(token).toBe('test-token');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pluggy.ai/auth',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          }),
        }),
      );
    });

    it('should cache token on subsequent calls', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'cached-token' }));

      await authenticate();
      const token2 = await authenticate();

      expect(token2).toBe('cached-token');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw PluggyError on auth failure', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Invalid credentials' }, 401));

      await expect(authenticate()).rejects.toThrow(PluggyError);
    });
  });

  describe('createConnectToken', () => {
    it('should create a connect token', async () => {
      // Auth call
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'token' }));
      // Connect token call
      mockFetch.mockResolvedValueOnce(jsonResponse({ accessToken: 'connect-token-123' }));

      const result = await createConnectToken();

      expect(result.accessToken).toBe('connect-token-123');
    });

    it('should pass itemId when reconnecting', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'token' }));
      mockFetch.mockResolvedValueOnce(jsonResponse({ accessToken: 'reconnect-token' }));

      await createConnectToken('item-123');

      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.pluggy.ai/connect_token',
        expect.objectContaining({
          body: JSON.stringify({ itemId: 'item-123' }),
        }),
      );
    });
  });

  describe('getItem', () => {
    it('should fetch item by id', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'token' }));
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ id: 'item-1', status: 'UPDATED', connector: { id: 1, name: 'Banco do Brasil' } }),
      );

      const item = await getItem('item-1');

      expect(item.id).toBe('item-1');
      expect(item.status).toBe('UPDATED');
    });
  });

  describe('getAccounts', () => {
    it('should fetch accounts for an item', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'token' }));
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          total: 2,
          totalPages: 1,
          page: 1,
          results: [
            { id: 'acc-1', name: 'Conta Corrente', type: 'BANK', balance: 1500 },
            { id: 'acc-2', name: 'Poupança', type: 'BANK', balance: 5000 },
          ],
        }),
      );

      const accounts = await getAccounts('item-1');

      expect(accounts).toHaveLength(2);
      expect(accounts[0].name).toBe('Conta Corrente');
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions with pagination', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'token' }));
      // Page 1
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          total: 3,
          totalPages: 2,
          page: 1,
          results: [
            { id: 'tx-1', description: 'IFOOD', amount: -45.9, type: 'DEBIT' },
            { id: 'tx-2', description: 'SALARIO', amount: 5000, type: 'CREDIT' },
          ],
        }),
      );
      // Page 2
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          total: 3,
          totalPages: 2,
          page: 2,
          results: [{ id: 'tx-3', description: 'UBER', amount: -23, type: 'DEBIT' }],
        }),
      );

      const transactions = await getTransactions('acc-1', '2026-01-01', '2026-03-01');

      expect(transactions).toHaveLength(3);
      expect(transactions[0].id).toBe('tx-1');
      expect(transactions[2].id).toBe('tx-3');
    });

    it('should handle single page of transactions', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'token' }));
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          total: 1,
          totalPages: 1,
          page: 1,
          results: [{ id: 'tx-1', description: 'PIX', amount: -100, type: 'DEBIT' }],
        }),
      );

      const transactions = await getTransactions('acc-1', '2026-01-01', '2026-03-01');

      expect(transactions).toHaveLength(1);
    });
  });

  describe('retry logic', () => {
    it('should retry on 429 (rate limit)', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'token' }));
      // First attempt: 429
      mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Rate limited' }, 429));
      // Retry: success
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ id: 'item-1', status: 'UPDATED', connector: { id: 1, name: 'Test' } }),
      );

      const item = await getItem('item-1');

      expect(item.id).toBe('item-1');
      expect(mockFetch).toHaveBeenCalledTimes(3); // auth + 429 + retry
    });

    it('should retry on 500 server error', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'token' }));
      mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Server error' }, 500));
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ total: 0, totalPages: 1, page: 1, results: [] }),
      );

      const accounts = await getAccounts('item-1');

      expect(accounts).toHaveLength(0);
    });

    it('should throw after max retries', { timeout: 15000 }, async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ apiKey: 'token' }));
      mockFetch.mockResolvedValue(jsonResponse({ message: 'Server error' }, 500));

      await expect(getItem('item-1')).rejects.toThrow(PluggyError);
    });
  });
});
