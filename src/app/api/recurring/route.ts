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
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('amount', { ascending: false });

  if (error) {
    console.error('[recurring] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const subscriptions = (data || []).filter((r) => r.type === 'subscription');
  const installments = (data || []).filter((r) => r.type === 'installment');
  const monthlyTotal = (data || []).reduce((sum, r) => sum + Number(r.amount), 0);

  return NextResponse.json(
    { subscriptions, installments, monthlyTotal },
    { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' } },
  );
}
