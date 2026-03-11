const requiredServerVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const optionalServerVars = [
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRO_PRICE_ID',
  'PLUGGY_CLIENT_ID',
  'PLUGGY_CLIENT_SECRET',
  'PLUGGY_WEBHOOK_SECRET',
] as const;

export function validateEnv() {
  const missing = requiredServerVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Check .env.local`,
    );
  }

  if (process.env.NODE_ENV === 'development') {
    const missingOptional = optionalServerVars.filter((v) => !process.env[v]);
    if (missingOptional.length > 0) {
      console.warn(`[env] Optional vars not set: ${missingOptional.join(', ')}`);
    }
  }
}

export function getPluggyConfig() {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Pluggy environment variables. Set PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET in .env.local',
    );
  }

  return { clientId, clientSecret };
}

export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  return key;
}
