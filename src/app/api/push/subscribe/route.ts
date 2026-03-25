import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const POST = withAuth(async (request, { user }) => {
  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  const db = createAdminClient();

  const { error } = await (db as unknown as { from: (t: string) => ReturnType<typeof db.from> })
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    );

  if (error) {
    console.error('[push] Subscribe error:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

export const DELETE = withAuth(async (request, { user }) => {
  const body = await request.json();
  const { endpoint } = body;

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  const db = createAdminClient();

  await (db as unknown as { from: (t: string) => ReturnType<typeof db.from> })
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', user.id);

  return NextResponse.json({ success: true });
});
