import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
}
