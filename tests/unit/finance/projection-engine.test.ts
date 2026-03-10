import { describe, it, expect } from 'vitest';
import { calculateProjections, summarizeByMonth } from '@/lib/finance/projection-engine';

describe('summarizeByMonth', () => {
  it('groups transactions by month', () => {
    const txs = [
      { date: '2026-01-05', type: 'credit', amount: 5000 },
      { date: '2026-01-10', type: 'debit', amount: 2000 },
      { date: '2026-01-15', type: 'debit', amount: 1000 },
      { date: '2026-02-05', type: 'credit', amount: 5000 },
      { date: '2026-02-10', type: 'debit', amount: 2500 },
    ];
    const result = summarizeByMonth(txs);
    expect(result).toHaveLength(2);
    expect(result[0].income).toBe(5000);
    expect(result[0].expenses).toBe(3000);
    expect(result[1].income).toBe(5000);
    expect(result[1].expenses).toBe(2500);
  });
});

describe('calculateProjections', () => {
  const baseTxs = [
    { date: '2026-01-05', type: 'credit', amount: 5000 },
    { date: '2026-01-10', type: 'debit', amount: 3000 },
    { date: '2026-02-05', type: 'credit', amount: 5000 },
    { date: '2026-02-10', type: 'debit', amount: 3000 },
    { date: '2026-03-05', type: 'credit', amount: 5000 },
    { date: '2026-03-10', type: 'debit', amount: 3000 },
  ];

  it('returns hasEnoughData=false with < 2 months', () => {
    const txs = [{ date: '2026-01-05', type: 'credit', amount: 5000 }];
    const result = calculateProjections(txs, 10000);
    expect(result.hasEnoughData).toBe(false);
    expect(result.scenarios).toHaveLength(0);
  });

  it('calculates 3 scenarios', () => {
    const result = calculateProjections(baseTxs, 10000, 12);
    expect(result.hasEnoughData).toBe(true);
    expect(result.scenarios).toHaveLength(3);
    expect(result.scenarios.map((s) => s.label)).toEqual(['optimistic', 'realistic', 'pessimistic']);
  });

  it('realistic scenario uses current savings rate', () => {
    const result = calculateProjections(baseTxs, 10000, 12);
    const realistic = result.scenarios.find((s) => s.label === 'realistic')!;
    // avgIncome=5000, avgExpenses=3000, savings=2000/month
    expect(realistic.monthlySavings).toBe(2000);
    expect(realistic.finalBalance).toBe(10000 + 2000 * 12);
  });

  it('optimistic scenario saves more', () => {
    const result = calculateProjections(baseTxs, 10000, 12);
    const optimistic = result.scenarios.find((s) => s.label === 'optimistic')!;
    const realistic = result.scenarios.find((s) => s.label === 'realistic')!;
    expect(optimistic.finalBalance).toBeGreaterThan(realistic.finalBalance);
  });

  it('pessimistic scenario saves less', () => {
    const result = calculateProjections(baseTxs, 10000, 12);
    const pessimistic = result.scenarios.find((s) => s.label === 'pessimistic')!;
    const realistic = result.scenarios.find((s) => s.label === 'realistic')!;
    expect(pessimistic.finalBalance).toBeLessThan(realistic.finalBalance);
  });

  it('handles zero income', () => {
    const txs = [
      { date: '2026-01-05', type: 'debit', amount: 1000 },
      { date: '2026-02-05', type: 'debit', amount: 1000 },
    ];
    const result = calculateProjections(txs, 5000);
    expect(result.hasEnoughData).toBe(true);
    expect(result.savingsRate).toBe(0);
  });

  it('generates correct number of monthly points', () => {
    const result = calculateProjections(baseTxs, 10000, 6);
    expect(result.scenarios[0].monthlyData).toHaveLength(6);
  });
});
