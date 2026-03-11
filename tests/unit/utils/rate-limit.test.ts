import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/utils/rate-limit';

describe('rateLimit', () => {
  it('should allow requests within limit', () => {
    const config = { maxRequests: 3, windowMs: 60_000 };
    const r1 = rateLimit('test-allow-1', config);
    const r2 = rateLimit('test-allow-1', config);
    const r3 = rateLimit('test-allow-1', config);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('should block requests exceeding limit', () => {
    const config = { maxRequests: 2, windowMs: 60_000 };
    rateLimit('test-block-1', config);
    rateLimit('test-block-1', config);
    const r3 = rateLimit('test-block-1', config);

    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.resetAt).toBeGreaterThan(Date.now());
  });

  it('should track keys independently', () => {
    const config = { maxRequests: 1, windowMs: 60_000 };
    const r1 = rateLimit('test-independent-a', config);
    const r2 = rateLimit('test-independent-b', config);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  it('should include Retry-After-compatible resetAt', () => {
    const config = { maxRequests: 1, windowMs: 30_000 };
    rateLimit('test-reset-1', config);
    const blocked = rateLimit('test-reset-1', config);

    expect(blocked.allowed).toBe(false);
    const retryAfterSeconds = Math.ceil((blocked.resetAt - Date.now()) / 1000);
    expect(retryAfterSeconds).toBeGreaterThan(0);
    expect(retryAfterSeconds).toBeLessThanOrEqual(30);
  });
});
