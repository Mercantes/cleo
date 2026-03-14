import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (_request, { supabase, user }) => {
  const { data: connections, error } = await supabase
    .from('bank_connections')
    .select('id, connector_name, connector_logo_url, status, last_sync_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }

  return NextResponse.json({ connections: connections || [] });
});

export const DELETE = withAuth(async (request: NextRequest, { supabase, user }) => {
  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get('id');

  if (!connectionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(connectionId)) {
    return NextResponse.json({ error: 'Invalid connection ID' }, { status: 400 });
  }

  const { error } = await supabase
    .from('bank_connections')
    .delete()
    .eq('id', connectionId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to disconnect bank' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
