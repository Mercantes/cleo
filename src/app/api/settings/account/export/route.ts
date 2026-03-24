import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

export const GET = withAuth(async (_request, { supabase, user }) => {
  // Rate limit: 3 requests/min per user
  const rl = rateLimit(`account-export:${user.id}`, RATE_LIMITS['account-export']);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const userId = user.id;

  const [profile, transactions, bankConnections, chatMessages, settings, recurring] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(5000),
      supabase.from('bank_connections').select('id, connector_name, status, created_at').eq('user_id', userId),
      supabase.from('chat_messages').select('role, content, created_at').eq('user_id', userId).order('created_at').limit(1000),
      supabase.from('user_settings').select('*').eq('user_id', userId).single(),
      supabase.from('recurring_transactions').select('*').eq('user_id', userId).limit(200),
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
