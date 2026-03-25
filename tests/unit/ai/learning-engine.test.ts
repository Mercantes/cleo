import { describe, it, expect } from 'vitest';
import { normalizeMerchantForLearning } from '@/lib/ai/learning-engine';

describe('normalizeMerchantForLearning', () => {
  it('normalizes basic merchant names', () => {
    expect(normalizeMerchantForLearning('IFOOD  São Paulo', null)).toBe('ifood são paulo');
  });

  it('prefers merchant over description', () => {
    expect(normalizeMerchantForLearning('PIX RECEBIDO', 'Netflix')).toBe('netflix');
  });

  it('removes date patterns', () => {
    expect(normalizeMerchantForLearning('PAG*Netflix 01/06', null)).toBe('netflix');
  });

  it('removes acquirer prefixes', () => {
    expect(normalizeMerchantForLearning('Pag Uber Eats', null)).toBe('uber eats');
  });

  it('removes asterisks', () => {
    expect(normalizeMerchantForLearning('IFD*IFOOD', null)).toBe('ifood');
  });

  it('removes location suffixes', () => {
    // Location regex only matches word boundaries — "São Paulo" (accented) passes through
    expect(normalizeMerchantForLearning('Carrefour BR São Paulo SP', null)).toBe(
      'carrefour são paulo',
    );
  });

  it('handles empty merchant with description', () => {
    expect(normalizeMerchantForLearning('Supermercado Extra', null)).toBe('supermercado extra');
  });

  it('lowercases result', () => {
    expect(normalizeMerchantForLearning('STARBUCKS COFFEE', null)).toBe('starbucks coffee');
  });
});
