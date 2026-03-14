import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (_request, { supabase, user }) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, description, amount, date, type, merchant, categories(name, icon)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(8);

  if (error) {
    console.error('[dashboard/recent] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({
    transactions: data || [],
  }, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  });
});
