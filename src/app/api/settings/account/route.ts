import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const DELETE = withAuth(async (_request, { supabase, user }) => {
  const userId = user.id;

  // Delete user data in dependency order (child tables first)
  await Promise.allSettled([
    supabase.from('chat_messages').delete().eq('user_id', userId),
    supabase.from('chat_usage').delete().eq('user_id', userId),
  ]);

  await Promise.allSettled([
    supabase.from('recurring_transactions').delete().eq('user_id', userId),
    supabase.from('subscriptions').delete().eq('user_id', userId),
    supabase.from('transactions').delete().eq('user_id', userId),
  ]);

  await Promise.allSettled([
    supabase.from('accounts').delete().eq('user_id', userId),
  ]);

  await Promise.allSettled([
    supabase.from('bank_connections').delete().eq('user_id', userId),
    supabase.from('user_settings').delete().eq('user_id', userId),
  ]);

  // profiles uses 'id' instead of 'user_id'
  await supabase.from('profiles').delete().eq('id', userId);

  return NextResponse.json({ success: true });
});
