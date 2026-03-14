import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (request: NextRequest, { supabase, user }) => {
  const searchParams = request.nextUrl.searchParams;
  const before = searchParams.get('before');

  let query = supabase
    .from('chat_messages')
    .select('id, role, content, metadata, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[chat/history] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Reverse to get chronological order
  return NextResponse.json({ messages: (data || []).reverse() });
});

export const DELETE = withAuth(async (_request, { supabase, user }) => {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('[chat/history] delete failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
