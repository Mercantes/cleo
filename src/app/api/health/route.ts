import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rl = rateLimit('health:global', RATE_LIMITS.api);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }
  const checks: Record<string, 'ok' | 'error'> = {};

  // Check Supabase connectivity
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error } = await supabase.from('categories').select('id').limit(1);
    checks.database = error ? 'error' : 'ok';
  } catch {
    checks.database = 'error';
  }

  // Check required env vars
  checks.env = (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.ANTHROPIC_API_KEY
  ) ? 'ok' : 'error';

  // Check Stripe configuration
  checks.stripe = process.env.STRIPE_SECRET_KEY ? 'ok' : 'error';

  // Check external API connectivity (lightweight)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://api.anthropic.com/', {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeout);
    checks.anthropic = res ? 'ok' : 'error';
  } catch {
    checks.anthropic = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    checks,
  }, {
    status: allOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
