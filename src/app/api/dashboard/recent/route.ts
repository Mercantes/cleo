import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
}
