import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createConnectToken } from '@/lib/pluggy/client';
import { PluggyError } from '@/lib/pluggy/types';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { itemId?: string };
    const token = await createConnectToken(body.itemId);

    return NextResponse.json({ accessToken: token.accessToken });
  } catch (error) {
    if (error instanceof PluggyError) {
      return NextResponse.json(
        { error: `Pluggy error: ${error.message}` },
        { status: error.statusCode || 500 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
