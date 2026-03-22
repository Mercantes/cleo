import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (_request, { supabase, user }) => {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('amount', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[recurring] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Apply user overrides: if user_override is set, use it as the effective type
  // Filter out dismissed items
  const items = (data || [])
    .filter((r) => r.user_override !== 'dismissed')
    .map((r) => ({
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

// POST: User manually adds a recurring transaction
export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  const body = await request.json();
  const { merchant, amount, type, frequency } = body;

  if (!merchant || !amount || !type || !['subscription', 'installment', 'income'].includes(type)) {
    return NextResponse.json({ error: 'merchant, amount, and type (subscription|installment|income) are required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id: user.id,
      merchant,
      amount,
      type,
      frequency: frequency || 'monthly',
      transaction_pattern: `manual:${merchant.toLowerCase().replace(/\s+/g, '-')}`,
      status: 'active',
      user_override: type,
      confidence: 'high',
      occurrences: 0,
      next_expected_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
    });

  if (error) {
    console.error('[recurring] manual add failed:', error.message);
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

// PATCH: User manually reclassifies or edits a recurring transaction
export const PATCH = withAuth(async (request: NextRequest, { supabase, user }) => {
  const body = await request.json();
  const { id, type, amount } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  // Build update payload
  const update: Record<string, unknown> = {};
  if (type) {
    if (!['subscription', 'installment', 'income'].includes(type)) {
      return NextResponse.json({ error: 'type must be subscription|installment|income' }, { status: 400 });
    }
    update.user_override = type;
  }
  if (amount !== undefined) {
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }
    update.amount = amount;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'type or amount required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('recurring_transactions')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[recurring] override failed:', error.message);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

// DELETE: User dismisses a recurring transaction (marks as dismissed, persists across re-detection)
export const DELETE = withAuth(async (request: NextRequest, { supabase, user }) => {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('recurring_transactions')
    .update({ user_override: 'dismissed', status: 'dismissed' })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[recurring] dismiss failed:', error.message);
    return NextResponse.json({ error: 'Failed to dismiss' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
