import { describe, it, expect } from 'vitest';
import { calculateRetirement } from '@/lib/finance/retirement-engine';

describe('calculateRetirement', () => {
  const baseInput = {
    currentPortfolio: 50000,
    monthlySavings: 2000,
    targetMonthlyIncome: 5000,
    annualReturnRate: 0.08,
  };

  it('calculates FI number using 25x rule', () => {
    const result = calculateRetirement(baseInput);
    expect(result.fiNumber).toBe(5000 * 12 * 25); // 1,500,000
  });

  it('returns positive years to FI', () => {
    const result = calculateRetirement(baseInput);
    expect(result.yearsToFI).toBeGreaterThan(0);
    expect(result.yearsToFI).toBeLessThan(50);
  });

  it('generates portfolio timeline', () => {
    const result = calculateRetirement(baseInput);
    expect(result.portfolioTimeline.length).toBeGreaterThan(1);
    expect(result.portfolioTimeline[0].year).toBe(0);
    expect(result.portfolioTimeline[0].balance).toBe(50000);
  });

  it('generates 3 scenarios', () => {
    const result = calculateRetirement(baseInput);
    expect(result.scenarios).toHaveLength(3);
    expect(result.scenarios[0].extraMonthly).toBe(200);
    expect(result.scenarios[1].extraMonthly).toBe(500);
    expect(result.scenarios[2].extraMonthly).toBe(1000);
  });

  it('extra savings reduces years to FI', () => {
    const result = calculateRetirement(baseInput);
    for (const s of result.scenarios) {
      expect(s.yearsSaved).toBeGreaterThanOrEqual(0);
    }
  });

  it('already retired returns 0 years', () => {
    const result = calculateRetirement({
      ...baseInput,
      currentPortfolio: 2000000,
    });
    expect(result.yearsToFI).toBe(0);
  });

  it('zero savings with zero portfolio returns -1 (unreachable)', () => {
    const result = calculateRetirement({
      ...baseInput,
      currentPortfolio: 0,
      monthlySavings: 0,
      annualReturnRate: 0,
    });
    expect(result.yearsToFI).toBe(-1);
  });

  it('calculates gap analysis', () => {
    const result = calculateRetirement(baseInput);
    expect(typeof result.gap).toBe('number');
    expect(typeof result.requiredMonthlySavings).toBe('number');
  });
});
