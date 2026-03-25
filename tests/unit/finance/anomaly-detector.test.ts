import { describe, it, expect } from 'vitest';
import { welfordUpdate } from '@/lib/finance/anomaly-detector';

describe('welfordUpdate', () => {
  it('handles first value', () => {
    const result = welfordUpdate(0, 0, 0, 100);
    expect(result.mean).toBe(100);
    expect(result.stddev).toBe(0);
    expect(result.count).toBe(1);
  });

  it('computes mean correctly for two values', () => {
    let state = welfordUpdate(0, 0, 0, 100);
    state = welfordUpdate(state.mean, state.stddev, state.count, 200);
    expect(state.mean).toBe(150);
    expect(state.count).toBe(2);
  });

  it('computes stddev correctly for known series', () => {
    // Series: 10, 20, 30 → mean=20, sample stddev=10
    let state = welfordUpdate(0, 0, 0, 10);
    state = welfordUpdate(state.mean, state.stddev, state.count, 20);
    state = welfordUpdate(state.mean, state.stddev, state.count, 30);
    expect(state.mean).toBe(20);
    expect(state.stddev).toBe(10);
    expect(state.count).toBe(3);
  });

  it('handles identical values (zero stddev)', () => {
    let state = welfordUpdate(0, 0, 0, 50);
    state = welfordUpdate(state.mean, state.stddev, state.count, 50);
    state = welfordUpdate(state.mean, state.stddev, state.count, 50);
    expect(state.mean).toBe(50);
    expect(state.stddev).toBe(0);
  });

  it('incrementally matches batch computation', () => {
    const values = [10, 20, 30, 40, 50];
    let state = { mean: 0, stddev: 0, count: 0 };
    for (const v of values) {
      state = welfordUpdate(state.mean, state.stddev, state.count, v);
    }

    // Expected: mean=30, sample stddev=sqrt(250/4)≈15.81
    expect(state.mean).toBe(30);
    expect(state.stddev).toBeCloseTo(15.81, 1);
    expect(state.count).toBe(5);
  });
});
