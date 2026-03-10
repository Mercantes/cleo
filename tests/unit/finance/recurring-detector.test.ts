import { describe, it, expect } from 'vitest';
import {
  detectRecurringFromTransactions,
  normalizeMerchant,
  isAmountSimilar,
  detectInstallmentPattern,
} from '@/lib/finance/recurring-detector';

function makeTx(overrides: Partial<{
  id: string;
  description: string;
  amount: number;
  merchant: string | null;
  date: string;
  type: 'debit' | 'credit';
}> = {}) {
  return {
    id: overrides.id ?? '1',
    description: overrides.description ?? 'Netflix',
    amount: overrides.amount ?? 39.9,
    merchant: overrides.merchant ?? 'Netflix',
    date: overrides.date ?? '2026-01-15',
    type: overrides.type ?? 'debit',
  };
}

describe('normalizeMerchant', () => {
  it('normalizes merchant name', () => {
    expect(normalizeMerchant('NETFLIX*BR 01/06', null)).toBe('netflix br');
  });

  it('uses description when merchant is null', () => {
    expect(normalizeMerchant('SPOTIFY PREMIUM', null)).toBe('spotify premium');
  });

  it('prefers merchant over description', () => {
    expect(normalizeMerchant('some desc', 'Netflix')).toBe('netflix');
  });
});

describe('isAmountSimilar', () => {
  it('returns true for equal amounts', () => {
    expect(isAmountSimilar(39.9, 39.9)).toBe(true);
  });

  it('returns true within 5% tolerance', () => {
    expect(isAmountSimilar(100, 104)).toBe(true);
  });

  it('returns false beyond 5% tolerance', () => {
    expect(isAmountSimilar(100, 110)).toBe(false);
  });

  it('returns false for zero amounts', () => {
    expect(isAmountSimilar(0, 100)).toBe(false);
  });
});

describe('detectInstallmentPattern', () => {
  it('detects X/Y pattern', () => {
    expect(detectInstallmentPattern('Compra 3/12')).toEqual({ current: 3, total: 12 });
  });

  it('detects X de Y pattern', () => {
    expect(detectInstallmentPattern('Parcela 5 de 10')).toEqual({ current: 5, total: 10 });
  });

  it('returns null for no pattern', () => {
    expect(detectInstallmentPattern('Netflix Premium')).toBeNull();
  });
});

describe('detectRecurringFromTransactions', () => {
  it('detects monthly subscription with 2+ months', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-15', amount: 39.9, merchant: 'Netflix' }),
      makeTx({ id: '2', date: '2026-02-15', amount: 39.9, merchant: 'Netflix' }),
      makeTx({ id: '3', date: '2026-03-14', amount: 39.9, merchant: 'Netflix' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('subscription');
    expect(results[0].merchant).toBe('Netflix');
    expect(results[0].frequency).toBe('monthly');
  });

  it('detects installments with X/Y pattern', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-10', description: 'Loja ABC 1/6', merchant: 'Loja ABC', amount: 150 }),
      makeTx({ id: '2', date: '2026-02-10', description: 'Loja ABC 2/6', merchant: 'Loja ABC', amount: 150 }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('installment');
    expect(results[0].installments_remaining).toBe(4);
  });

  it('does not flag single occurrence', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-15', amount: 39.9, merchant: 'Netflix' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(0);
  });

  it('skips credit transactions', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-15', type: 'credit', merchant: 'Salary' }),
      makeTx({ id: '2', date: '2026-02-15', type: 'credit', merchant: 'Salary' }),
      makeTx({ id: '3', date: '2026-03-15', type: 'credit', merchant: 'Salary' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(0);
  });

  it('does not flag inconsistent amounts', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-15', amount: 50, merchant: 'Store' }),
      makeTx({ id: '2', date: '2026-02-15', amount: 200, merchant: 'Store' }),
      makeTx({ id: '3', date: '2026-03-15', amount: 30, merchant: 'Store' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(0);
  });

  it('allows 5% amount tolerance for subscriptions', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-15', amount: 100, merchant: 'Service' }),
      makeTx({ id: '2', date: '2026-02-15', amount: 104, merchant: 'Service' }),
      makeTx({ id: '3', date: '2026-03-15', amount: 102, merchant: 'Service' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('subscription');
  });
});
