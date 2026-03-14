import { NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

/**
 * Apply rate limiting to an API route handler.
 * Returns a 429 response if rate limit exceeded, null if allowed.
 */
export function checkRateLimit(
  userId: string,
  type: keyof typeof RATE_LIMITS = 'api',
): NextResponse | null {
  const result = rateLimit(`${type}:${userId}`, RATE_LIMITS[type]);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  return null;
}
