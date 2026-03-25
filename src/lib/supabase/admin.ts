import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminClient: SupabaseClient<any> | null = null;

/**
 * Admin client that bypasses RLS.
 * Use ONLY in server-side Route Handlers (webhooks, cron, service operations).
 * NEVER import this in client-side code.
 *
 * Returns a singleton instance to avoid creating multiple clients.
 * Note: Uses untyped client because generated DB types are incomplete
 * (missing tables: challenges, goals, usage_tracking, category_budgets, etc.)
 * TODO: Add Database generic after regenerating types with `supabase gen types`
 */
export function createAdminClient() {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    _adminClient = createClient(url, key);
  }
  return _adminClient;
}
