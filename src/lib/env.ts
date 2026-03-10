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
