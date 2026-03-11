import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const now = new Date();
  const monthParam = searchParams.get('month') || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [year, month] = monthParam.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // Previous month
  const prevDate = new Date(year, month - 2, 1);
  const prevStart = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`;
  const prevEnd = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).toISOString().split('T')[0];

  const [currentResult, prevResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('date', prevStart)
      .lte('date', prevEnd),
  ]);

  if (currentResult.error) {
    console.error('[dashboard/summary] query failed:', currentResult.error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const current = currentResult.data || [];
  const prev = prevResult.data || [];

  const income = current.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = current.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? Number(((income - expenses) / income * 100).toFixed(1)) : 0;

  const prevExpenses = prev.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
  const percentChange = prevExpenses > 0
    ? Number(((expenses - prevExpenses) / prevExpenses * 100).toFixed(1))
    : 0;

  return NextResponse.json({
    income,
    expenses,
    balance,
    savingsRate,
    percentChange,
    month: monthParam,
  }, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  });
}
