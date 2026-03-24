/**
 * Simple in-memory rate limiter using a sliding window.
 * Suitable for single-instance deployments (Vercel serverless).
 * For multi-instance, swap to Redis-based (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + config.windowMs,
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetAt: now + config.windowMs,
  };
}

/** Pre-configured limiters for common use cases */
export const RATE_LIMITS = {
  /** Chat/AI: 20 requests per minute per user */
  chat: { maxRequests: 20, windowMs: 60 * 1000 },
  /** General API: 60 requests per minute per user */
  api: { maxRequests: 60, windowMs: 60 * 1000 },
  /** Auth: 10 attempts per 15 minutes per IP */
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
  /** Stripe checkout: 5 requests per minute per user */
  'stripe-checkout': { maxRequests: 5, windowMs: 60 * 1000 },
  /** Pluggy sync: 3 requests per minute per user */
  'pluggy-sync': { maxRequests: 3, windowMs: 60 * 1000 },
  /** Pluggy import: 3 requests per minute per user */
  'pluggy-import': { maxRequests: 3, windowMs: 60 * 1000 },
  /** Transaction export: 5 requests per minute per user */
  'transactions-export': { maxRequests: 5, windowMs: 60 * 1000 },
  /** Account data export: 3 requests per minute per user */
  'account-export': { maxRequests: 3, windowMs: 60 * 1000 },
} as const;
