import { describe, it, expect } from 'vitest';
import { computeEWMA } from '@/lib/finance/prediction-engine';

describe('computeEWMA', () => {
  it('returns 0 for empty array', () => {
    expect(computeEWMA([])).toBe(0);
  });

  it('returns single value for array with one element', () => {
    expect(computeEWMA([100])).toBe(100);
  });

  it('weights recent values more heavily', () => {
    // Series: 100, 200 with alpha=0.3
    // EWMA = 0.3 * 200 + 0.7 * 100 = 60 + 70 = 130
    const result = computeEWMA([100, 200], 0.3);
    expect(result).toBe(130);
  });

  it('responds to trend changes', () => {
    // Rising trend: EWMA should be between min and max, closer to recent values
    const rising = computeEWMA([100, 200, 300, 400, 500], 0.3);
    expect(rising).toBeGreaterThan(300); // More than simple average
    expect(rising).toBeLessThan(500); // Less than last value
  });

  it('stabilizes with constant values', () => {
    const constant = computeEWMA([100, 100, 100, 100, 100], 0.3);
    expect(constant).toBe(100);
  });

  it('high alpha responds faster to changes', () => {
    const series = [100, 100, 100, 500];
    const slowAlpha = computeEWMA(series, 0.1);
    const fastAlpha = computeEWMA(series, 0.9);
    // Fast alpha should be closer to 500
    expect(fastAlpha).toBeGreaterThan(slowAlpha);
  });

  it('rounds to 2 decimal places', () => {
    const result = computeEWMA([33.33, 66.66], 0.3);
    const decimalPlaces = result.toString().split('.')[1]?.length || 0;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});
