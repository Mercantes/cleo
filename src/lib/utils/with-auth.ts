import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/utils/api-rate-limit';

interface AuthUser {
  id: string;
  email?: string;
  created_at?: string;
}

interface AuthContext {
  supabase: SupabaseClient;
  user: AuthUser;
}

type AuthHandler = (request: NextRequest, ctx: AuthContext) => Promise<NextResponse>;

/**
 * Wraps an API route handler with authentication and rate limiting.
 * Eliminates repeated auth + rate limit boilerplate across routes.
 */
export function withAuth(handler: AuthHandler) {
  return async (request: NextRequest) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limited = checkRateLimit(user.id);
    if (limited) return limited;

    return handler(request, { supabase, user });
  };
}
