import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (_request, { supabase, user }) => {
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

  // Apply user overrides: if user_override is set, use it as the effective type
  const items = (data || []).map((r) => ({
    ...r,
    type: r.user_override || r.type,
  }));

  const subscriptions = items.filter((r) => r.type === 'subscription');
  const installments = items.filter((r) => r.type === 'installment');
  const income = items.filter((r) => r.type === 'income');
  const expenseItems = items.filter((r) => r.type !== 'income');
  const monthlyTotal = expenseItems.reduce((sum, r) => sum + Number(r.amount), 0);
  const monthlyIncome = income.reduce((sum, r) => sum + Number(r.amount), 0);

  return NextResponse.json(
    { subscriptions, installments, income, monthlyTotal, monthlyIncome },
    { headers: { 'Cache-Control': 'private, no-cache' } },
  );
});

// PATCH: User manually reclassifies a recurring transaction
export const PATCH = withAuth(async (request: NextRequest, { supabase, user }) => {
  const body = await request.json();
  const { id, type } = body;

  if (!id || !type || !['subscription', 'installment', 'income'].includes(type)) {
    return NextResponse.json({ error: 'id and type (subscription|installment|income) are required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('recurring_transactions')
    .update({ user_override: type })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[recurring] override failed:', error.message);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
