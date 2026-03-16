import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

const PAGE_SIZE = 50;

export const GET = withAuth(async (request: NextRequest, { supabase, user }) => {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category');
  const bank = searchParams.get('bank');
  const type = searchParams.get('type');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);

  let query = supabase
    .from('transactions')
    .select('*, categories(*), accounts(id, name, type, bank_connections(connector_name, connector_logo_url))', { count: 'exact' })
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (category === 'uncategorized') {
    query = query.is('category_id', null);
  } else if (category) {
    query = query.eq('category_id', category);
  }
  if (bank) query = query.eq('account_id', bank);
  if (type) query = query.eq('type', type);
  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);
  if (search) {
    // Escape SQL wildcards and limit length to prevent pattern abuse
    const sanitized = search.slice(0, 100).replace(/[%_\\]/g, '\\$&');
    // Normalize Brazilian number format (comma → dot) and try to match amount
    const normalized = search.replace(',', '.');
    const numericValue = parseFloat(normalized);
    if (!isNaN(numericValue) && isFinite(numericValue)) {
      const abs = Math.abs(numericValue);
      query = query.or(`description.ilike.%${sanitized}%,merchant.ilike.%${sanitized}%,amount.eq.${abs},amount.eq.${-abs}`);
    } else {
      query = query.or(`description.ilike.%${sanitized}%,merchant.ilike.%${sanitized}%`);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[transactions] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Calculate summary totals across ALL matching transactions (not just current page)
  let summary: { income: number; expenses: number; balance: number } | undefined;
  if (page === 1) {
    // Build filtered queries for income and expenses aggregation
    let incomeQuery = supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'credit');

    let expenseQuery = supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'debit');

    // Apply same filters to both queries
    const applyFilters = (q: typeof incomeQuery) => {
      if (category === 'uncategorized') {
        q = q.is('category_id', null);
      } else if (category) {
        q = q.eq('category_id', category);
      }
      if (bank) q = q.eq('account_id', bank);
      if (from) q = q.gte('date', from);
      if (to) q = q.lte('date', to);
      if (search) {
        const sanitized = search.slice(0, 100).replace(/[%_\\]/g, '\\$&');
        const normalized = search.replace(',', '.');
        const numericValue = parseFloat(normalized);
        if (!isNaN(numericValue) && isFinite(numericValue)) {
          const abs = Math.abs(numericValue);
          q = q.or(`description.ilike.%${sanitized}%,merchant.ilike.%${sanitized}%,amount.eq.${abs},amount.eq.${-abs}`);
        } else {
          q = q.or(`description.ilike.%${sanitized}%,merchant.ilike.%${sanitized}%`);
        }
      }
      return q;
    };

    // Note: type filter is already applied (credit/debit split), but if user
    // filtered by type, one of these will return empty — which is correct
    if (type && type !== 'credit') {
      incomeQuery = incomeQuery.eq('type', 'impossible_match');
    }
    if (type && type !== 'debit') {
      expenseQuery = expenseQuery.eq('type', 'impossible_match');
    }

    incomeQuery = applyFilters(incomeQuery);
    expenseQuery = applyFilters(expenseQuery);

    const [incomeResult, expenseResult] = await Promise.all([
      incomeQuery,
      expenseQuery,
    ]);

    const totalIncome = (incomeResult.data || []).reduce((sum, row) => sum + (row.amount || 0), 0);
    const totalExpenses = (expenseResult.data || []).reduce((sum, row) => sum + Math.abs(row.amount || 0), 0);

    summary = {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses,
    };
  }

  return NextResponse.json({
    data: data || [],
    page,
    pageSize: PAGE_SIZE,
    total: count || 0,
    ...(summary && { summary }),
  });
});
