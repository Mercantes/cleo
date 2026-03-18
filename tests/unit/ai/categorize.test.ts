import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'categories') {
        return {
          select: () =>
            Promise.resolve({
              data: [
                { id: 'cat-1', name: 'Alimentação' },
                { id: 'cat-2', name: 'Transporte' },
                { id: 'cat-3', name: 'Outros' },
              ],
            }),
        };
      }
      if (table === 'transactions') {
        return {
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      return {};
    },
  }),
}));

import { buildPrompt, parseAIResponse, CATEGORIES, categorizeTransactions } from '@/lib/ai/categorize';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Categorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  describe('CATEGORIES', () => {
    it('should have 12 categories', () => {
      expect(CATEGORIES).toHaveLength(12);
      expect(CATEGORIES).toContain('Alimentação');
      expect(CATEGORIES).toContain('Outros');
    });
  });

  describe('buildPrompt', () => {
    it('should build prompt with transactions', () => {
      const prompt = buildPrompt([
        { id: 'tx-1', description: 'IFOOD *IFOOD', amount: 45.9, type: 'debit' },
      ]);

      expect(prompt).toContain('IFOOD *IFOOD');
      expect(prompt).toContain('R$45.90');
      expect(prompt).toContain('Alimentação');
    });
  });

  describe('parseAIResponse', () => {
    it('should parse valid JSON array', () => {
      const text = '[{"index": 1, "category": "Alimentação", "confidence": 0.95}]';
      const result = parseAIResponse(text);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Alimentação');
      expect(result[0].confidence).toBe(0.95);
    });

    it('should extract JSON from surrounding text', () => {
      const text = 'Here are the results:\n[{"index": 1, "category": "Transporte", "confidence": 0.8}]\nDone.';
      const result = parseAIResponse(text);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Transporte');
    });

    it('should return empty array on invalid JSON', () => {
      const result = parseAIResponse('not json at all');
      expect(result).toEqual([]);
    });
  });

  describe('categorizeTransactions', () => {
    it('should return 0 when no API key', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const result = await categorizeTransactions([
        { id: 'tx-1', description: 'Test', amount: 10, type: 'debit' },
      ]);

      expect(result).toBe(0);
    });

    it('should return 0 for empty transactions', async () => {
      const result = await categorizeTransactions([]);
      expect(result).toBe(0);
    });

    it('should categorize transactions via Claude API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [
              {
                text: '[{"index": 1, "category": "Outros", "confidence": 0.90}]',
              },
            ],
            usage: { input_tokens: 150, output_tokens: 30 },
          }),
      });

      const result = await categorizeTransactions([
        { id: 'tx-1', description: 'CINEMA XPTO', amount: 45.9, type: 'debit' },
      ]);

      expect(result).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should log token usage in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: '[{"index": 1, "category": "Outros", "confidence": 0.5}]' }],
            usage: { input_tokens: 200, output_tokens: 50 },
          }),
      });

      await categorizeTransactions([
        { id: 'tx-1', description: 'Unknown', amount: 10, type: 'debit' },
      ]);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[categorize] batch=0'),
      );
      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await categorizeTransactions([
        { id: 'tx-1', description: 'LOJA DESCONHECIDA XYZ', amount: 10, type: 'debit' },
      ]);

      expect(result).toBe(0);
    });
  });
});
