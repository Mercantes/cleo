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
    .select('*, categories(*)', { count: 'exact' })
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
    query = query.or(`description.ilike.%${sanitized}%,merchant.ilike.%${sanitized}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[transactions] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    page,
    pageSize: PAGE_SIZE,
    total: count || 0,
  });
});
