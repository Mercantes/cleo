import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (_request, { supabase, user }) => {
  const userId = user.id;

  const [profile, transactions, bankConnections, chatMessages, settings, recurring] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('bank_connections').select('id, connector_name, status, created_at').eq('user_id', userId),
      supabase.from('chat_messages').select('role, content, created_at').eq('user_id', userId).order('created_at'),
      supabase.from('user_settings').select('*').eq('user_id', userId).single(),
      supabase.from('recurring_transactions').select('*').eq('user_id', userId),
    ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      email: user.email,
      created_at: user.created_at,
    },
    profile: profile.data,
    transactions: transactions.data || [],
    bank_connections: bankConnections.data || [],
    chat_messages: chatMessages.data || [],
    settings: settings.data,
    recurring_transactions: recurring.data || [],
  };

  return NextResponse.json(exportData);
});
