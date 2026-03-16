import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectRecurringFromTransactions,
  normalizeMerchant,
  isAmountSimilar,
  detectInstallmentPattern,
  coefficientOfVariation,
  standardDeviation,
  isKnownSubscription,
  isKnownIncomeSource,
  isExcludedMerchant,
  hasMultiplePerMonth,
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

// Fix date for deterministic tests
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-03-20'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('normalizeMerchant', () => {
  it('normalizes merchant name', () => {
    expect(normalizeMerchant('NETFLIX*BR 01/06', null)).toBe('netflix');
  });

  it('uses description when merchant is null', () => {
    expect(normalizeMerchant('SPOTIFY PREMIUM', null)).toBe('spotify premium');
  });

  it('prefers merchant over description', () => {
    expect(normalizeMerchant('some desc', 'Netflix')).toBe('netflix');
  });

  it('removes location suffixes', () => {
    expect(normalizeMerchant('NETFLIX.COM SAO PAULO BR', null)).toBe('netflix.com');
  });

  it('removes acquirer prefixes (Dm*, Ifd*, Pag*)', () => {
    expect(normalizeMerchant('Dm*Spotify', null)).toBe('spotify');
    expect(normalizeMerchant('Ifd*Ifood Club', null)).toBe('ifood club');
    expect(normalizeMerchant('Pag*Netflix', null)).toBe('netflix');
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

describe('coefficientOfVariation', () => {
  it('returns 0 for identical values', () => {
    expect(coefficientOfVariation([100, 100, 100])).toBe(0);
  });

  it('returns low CV for similar values', () => {
    const cv = coefficientOfVariation([100, 102, 101, 99]);
    expect(cv).toBeLessThan(0.03);
  });

  it('returns high CV for varied values', () => {
    const cv = coefficientOfVariation([50, 200, 30, 150]);
    expect(cv).toBeGreaterThan(0.3);
  });

  it('returns 0 for single value', () => {
    expect(coefficientOfVariation([100])).toBe(0);
  });
});

describe('standardDeviation', () => {
  it('returns 0 for identical values', () => {
    expect(standardDeviation([30, 30, 30])).toBe(0);
  });

  it('returns low stddev for regular intervals', () => {
    const sd = standardDeviation([30, 31, 29, 30]);
    expect(sd).toBeLessThan(2);
  });

  it('returns high stddev for irregular intervals', () => {
    const sd = standardDeviation([5, 45, 10, 60]);
    expect(sd).toBeGreaterThan(15);
  });
});

describe('isKnownSubscription', () => {
  it('detects Netflix', () => {
    expect(isKnownSubscription('netflix')).toBe(true);
  });

  it('detects Spotify in longer string', () => {
    expect(isKnownSubscription('spotify premium')).toBe(true);
  });

  it('returns false for unknown merchant', () => {
    expect(isKnownSubscription('padaria do joao')).toBe(false);
  });
});

describe('hasMultiplePerMonth', () => {
  it('returns false for 1 per month', () => {
    const txs = [
      makeTx({ date: '2026-01-15' }),
      makeTx({ date: '2026-02-15' }),
      makeTx({ date: '2026-03-15' }),
    ];
    expect(hasMultiplePerMonth(txs)).toBe(false);
  });

  it('returns true for multiple per month', () => {
    const txs = [
      makeTx({ date: '2026-01-05' }),
      makeTx({ date: '2026-01-15' }),
      makeTx({ date: '2026-01-25' }),
      makeTx({ date: '2026-02-05' }),
      makeTx({ date: '2026-02-15' }),
      makeTx({ date: '2026-02-25' }),
    ];
    expect(hasMultiplePerMonth(txs)).toBe(true);
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
  // ===== SUBSCRIPTION DETECTION =====

  it('detects monthly subscription with regular intervals', () => {
    const transactions = [
      makeTx({ id: '1', date: '2025-10-15', amount: 39.9, merchant: 'Netflix' }),
      makeTx({ id: '2', date: '2025-11-15', amount: 39.9, merchant: 'Netflix' }),
      makeTx({ id: '3', date: '2025-12-15', amount: 39.9, merchant: 'Netflix' }),
      makeTx({ id: '4', date: '2026-01-15', amount: 39.9, merchant: 'Netflix' }),
      makeTx({ id: '5', date: '2026-02-15', amount: 39.9, merchant: 'Netflix' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('subscription');
    expect(results[0].status).toBe('active');
    expect(results[0].confidence).toBe('high'); // Known merchant
    expect(results[0].merchant).toBe('Netflix');
    expect(results[0].frequency).toBe('monthly');
  });

  it('detects known subscription with only 2 occurrences', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-20', amount: 21.9, merchant: 'Spotify' }),
      makeTx({ id: '2', date: '2026-02-20', amount: 21.9, merchant: 'Spotify' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('subscription');
    expect(results[0].confidence).toBe('high');
  });

  it('detects subscription with slight price variation (reajuste)', () => {
    // CV ~0.05 (between 3% and 15%) → subscription with price adjustments
    const transactions = [
      makeTx({ id: '1', date: '2025-11-15', amount: 100, merchant: 'Service' }),
      makeTx({ id: '2', date: '2025-12-15', amount: 108, merchant: 'Service' }),
      makeTx({ id: '3', date: '2026-01-15', amount: 95, merchant: 'Service' }),
      makeTx({ id: '4', date: '2026-02-15', amount: 110, merchant: 'Service' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('subscription');
  });

  it('detects variable subscription (phone bill) with regular intervals', () => {
    const transactions = [
      makeTx({ id: '1', date: '2025-11-10', amount: 89, merchant: 'Vivo' }),
      makeTx({ id: '2', date: '2025-12-10', amount: 112, merchant: 'Vivo' }),
      makeTx({ id: '3', date: '2026-01-10', amount: 95, merchant: 'Vivo' }),
      makeTx({ id: '4', date: '2026-02-10', amount: 105, merchant: 'Vivo' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('subscription');
    expect(results[0].confidence).toBe('high'); // Known merchant (vivo)
  });

  it('marks subscription as cancelled when last charge > 65 days ago', () => {
    // Use dates relative to today to avoid test becoming stale
    const today = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return d.toISOString().split('T')[0];
    };
    const transactions = [
      makeTx({ id: '1', date: daysAgo(190), amount: 39.9, merchant: 'Netflix' }),
      makeTx({ id: '2', date: daysAgo(160), amount: 39.9, merchant: 'Netflix' }),
      makeTx({ id: '3', date: daysAgo(130), amount: 39.9, merchant: 'Netflix' }),
      makeTx({ id: '4', date: daysAgo(100), amount: 39.9, merchant: 'Netflix' }),
      makeTx({ id: '5', date: daysAgo(70), amount: 39.9, merchant: 'Netflix' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('cancelled');
  });

  // ===== INSTALLMENT DETECTION =====

  it('classifies few months with exact amount as installment', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-10', amount: 500, merchant: 'SplashPiscinas' }),
      makeTx({ id: '2', date: '2026-02-10', amount: 500, merchant: 'SplashPiscinas' }),
      makeTx({ id: '3', date: '2026-03-10', amount: 500, merchant: 'SplashPiscinas' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('installment');
  });

  it('detects installments with X/Y pattern (highest precedence)', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-10', description: 'Loja ABC 1/6', merchant: 'Loja ABC', amount: 150 }),
      makeTx({ id: '2', date: '2026-02-10', description: 'Loja ABC 2/6', merchant: 'Loja ABC', amount: 150 }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('installment');
    expect(results[0].installments_remaining).toBe(4);
    expect(results[0].confidence).toBe('high');
  });

  it('classifies long parcela (10x) as installment with X/Y pattern', () => {
    const transactions = Array.from({ length: 6 }, (_, i) => makeTx({
      id: String(i + 1),
      date: `2025-${String(7 + i).padStart(2, '0')}-10`,
      description: `Geladeira ${i + 1}/10`,
      merchant: 'Magazine Luiza',
      amount: 350,
    }));

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('installment');
    expect(results[0].installments_remaining).toBe(4); // 6/10 → 4 remaining
  });

  // ===== FALSE POSITIVE PREVENTION =====

  it('does not flag single occurrence (unknown merchant)', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-15', amount: 39.9, merchant: 'RandomStore' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(0);
  });

  it('classifies credit transactions as income, not subscription', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-15', type: 'credit', merchant: 'Salary' }),
      makeTx({ id: '2', date: '2026-02-15', type: 'credit', merchant: 'Salary' }),
      makeTx({ id: '3', date: '2026-03-15', type: 'credit', merchant: 'Salary' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results.every(r => r.type === 'income')).toBe(true);
    expect(results.filter(r => r.type === 'subscription')).toHaveLength(0);
  });

  it('does not flag wildly inconsistent amounts', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-15', amount: 50, merchant: 'Store' }),
      makeTx({ id: '2', date: '2026-02-15', amount: 200, merchant: 'Store' }),
      makeTx({ id: '3', date: '2026-03-15', amount: 30, merchant: 'Store' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(0);
  });

  it('does not flag irregular intervals as subscription', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-05', amount: 50, merchant: 'Restaurante' }),
      makeTx({ id: '2', date: '2026-01-20', amount: 52, merchant: 'Restaurante' }),
      makeTx({ id: '3', date: '2026-02-28', amount: 48, merchant: 'Restaurante' }),
      makeTx({ id: '4', date: '2026-03-10', amount: 51, merchant: 'Restaurante' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(0);
  });

  it('does not flag multiple purchases per month as subscription', () => {
    // Uber rides: frequent but not a subscription
    const transactions = [
      makeTx({ id: '1', date: '2026-01-05', amount: 18, merchant: 'Uber Trip' }),
      makeTx({ id: '2', date: '2026-01-12', amount: 19, merchant: 'Uber Trip' }),
      makeTx({ id: '3', date: '2026-01-20', amount: 18, merchant: 'Uber Trip' }),
      makeTx({ id: '4', date: '2026-02-03', amount: 18, merchant: 'Uber Trip' }),
      makeTx({ id: '5', date: '2026-02-10', amount: 19, merchant: 'Uber Trip' }),
      makeTx({ id: '6', date: '2026-02-18', amount: 18, merchant: 'Uber Trip' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(0);
  });

  // ===== KNOWN SUBSCRIPTION FAST-PATH =====

  it('detects known subscription with single recent occurrence', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-03-10', amount: 34.9, merchant: 'Disney Plus', description: 'Disney Plus' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('subscription');
    expect(results[0].confidence).toBe('low');
  });

  it('does not flag known subscription if charge is old', () => {
    const transactions = [
      makeTx({ id: '1', date: '2025-12-01', amount: 34.9, merchant: 'Disney Plus', description: 'Disney Plus' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(0);
  });

  // ===== RECURRING INCOME DETECTION =====

  it('detects recurring salary (credit transactions)', () => {
    const transactions = [
      makeTx({ id: '1', date: '2025-11-05', amount: 5000, merchant: 'Empresa ABC', type: 'credit' }),
      makeTx({ id: '2', date: '2025-12-05', amount: 5000, merchant: 'Empresa ABC', type: 'credit' }),
      makeTx({ id: '3', date: '2026-01-05', amount: 5000, merchant: 'Empresa ABC', type: 'credit' }),
      makeTx({ id: '4', date: '2026-02-05', amount: 5000, merchant: 'Empresa ABC', type: 'credit' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    const incomeResults = results.filter(r => r.type === 'income');
    expect(incomeResults).toHaveLength(1);
    expect(incomeResults[0].type).toBe('income');
    expect(incomeResults[0].status).toBe('active');
    expect(incomeResults[0].confidence).toBe('high');
  });

  it('detects known income source with 3 occurrences', () => {
    const transactions = [
      makeTx({ id: '1', date: '2025-12-10', amount: 3500, merchant: 'Salario', description: 'Salario Dez', type: 'credit' }),
      makeTx({ id: '2', date: '2026-01-10', amount: 3500, merchant: 'Salario', description: 'Salario Jan', type: 'credit' }),
      makeTx({ id: '3', date: '2026-02-10', amount: 3500, merchant: 'Salario', description: 'Salario Fev', type: 'credit' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    const incomeResults = results.filter(r => r.type === 'income');
    expect(incomeResults).toHaveLength(1);
    expect(incomeResults[0].type).toBe('income');
    expect(incomeResults[0].confidence).toBe('high'); // Known source + 3 occurrences
  });

  it('detects recurring income with variable amounts (overtime/bonuses)', () => {
    const transactions = [
      makeTx({ id: '1', date: '2025-11-05', amount: 5000, merchant: 'Empresa XYZ', type: 'credit' }),
      makeTx({ id: '2', date: '2025-12-05', amount: 5200, merchant: 'Empresa XYZ', type: 'credit' }),
      makeTx({ id: '3', date: '2026-01-05', amount: 4800, merchant: 'Empresa XYZ', type: 'credit' }),
      makeTx({ id: '4', date: '2026-02-05', amount: 5100, merchant: 'Empresa XYZ', type: 'credit' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    const incomeResults = results.filter(r => r.type === 'income');
    expect(incomeResults).toHaveLength(1);
    expect(incomeResults[0].type).toBe('income');
  });

  it('does not flag irregular credit transactions as income', () => {
    const transactions = [
      makeTx({ id: '1', date: '2026-01-05', amount: 500, merchant: 'Amigo', type: 'credit' }),
      makeTx({ id: '2', date: '2026-01-20', amount: 200, merchant: 'Amigo', type: 'credit' }),
      makeTx({ id: '3', date: '2026-02-28', amount: 800, merchant: 'Amigo', type: 'credit' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    const incomeResults = results.filter(r => r.type === 'income');
    expect(incomeResults).toHaveLength(0);
  });

  it('does not mix credit and debit from same merchant', () => {
    const transactions = [
      makeTx({ id: '1', date: '2025-11-15', amount: 39.9, merchant: 'Netflix', type: 'debit' }),
      makeTx({ id: '2', date: '2025-12-15', amount: 39.9, merchant: 'Netflix', type: 'debit' }),
      makeTx({ id: '3', date: '2026-01-15', amount: 39.9, merchant: 'Netflix', type: 'debit' }),
      makeTx({ id: '4', date: '2026-02-15', amount: 39.9, merchant: 'Netflix', type: 'debit' }),
      makeTx({ id: '5', date: '2026-01-20', amount: 10, merchant: 'Netflix', type: 'credit' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    const subs = results.filter(r => r.type === 'subscription');
    const incomes = results.filter(r => r.type === 'income');
    expect(subs).toHaveLength(1);
    expect(incomes).toHaveLength(0); // Single credit = not recurring
  });
});

describe('isExcludedMerchant', () => {
  it('excludes bank names', () => {
    expect(isExcludedMerchant('banco xp s.a')).toBe(true);
    expect(isExcludedMerchant('banco c6 s.a.')).toBe(true);
  });

  it('excludes credit card bills', () => {
    expect(isExcludedMerchant('fatura cartao nubank')).toBe(true);
  });

  it('excludes transfers', () => {
    expect(isExcludedMerchant('pix joao silva')).toBe(true);
    expect(isExcludedMerchant('ted recebida')).toBe(true);
  });

  it('does not exclude regular merchants', () => {
    expect(isExcludedMerchant('netflix')).toBe(false);
    expect(isExcludedMerchant('spotify')).toBe(false);
  });
});

describe('detectRecurringFromTransactions — excluded merchants', () => {
  it('does not flag credit card bill as subscription', () => {
    const transactions = [
      makeTx({ id: '1', date: '2025-11-15', amount: 7169, merchant: 'BANCO XP S.A' }),
      makeTx({ id: '2', date: '2025-12-15', amount: 6800, merchant: 'BANCO XP S.A' }),
      makeTx({ id: '3', date: '2026-01-15', amount: 7200, merchant: 'BANCO XP S.A' }),
      makeTx({ id: '4', date: '2026-02-15', amount: 7100, merchant: 'BANCO XP S.A' }),
    ];

    const results = detectRecurringFromTransactions(transactions);
    expect(results).toHaveLength(0);
  });
});

describe('isKnownIncomeSource', () => {
  it('detects salario', () => {
    expect(isKnownIncomeSource('salario janeiro')).toBe(true);
  });

  it('detects aluguel', () => {
    expect(isKnownIncomeSource('aluguel apt 302')).toBe(true);
  });

  it('returns false for unknown source', () => {
    expect(isKnownIncomeSource('empresa abc')).toBe(false);
  });
});
