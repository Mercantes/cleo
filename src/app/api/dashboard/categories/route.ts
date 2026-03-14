import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (request: NextRequest, { supabase, user }) => {
  const searchParams = request.nextUrl.searchParams;
  const now = new Date();
  const monthParam = searchParams.get('month') || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [year, month] = monthParam.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // Previous month for comparison
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevEndDate = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

  const [{ data, error }, { data: prevData }] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, category_id, categories(name)')
      .eq('user_id', user.id)
      .eq('type', 'debit')
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('transactions')
      .select('amount, category_id, categories(name)')
      .eq('user_id', user.id)
      .eq('type', 'debit')
      .gte('date', prevStartDate)
      .lte('date', prevEndDate),
  ]);

  if (error) {
    console.error('[dashboard/categories] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Build previous month map
  const prevCategoryMap = new Map<string, number>();
  for (const tx of prevData || []) {
    const catObj = tx.categories as unknown as { name: string } | null;
    const catName = catObj?.name || 'Sem categoria';
    prevCategoryMap.set(catName, (prevCategoryMap.get(catName) || 0) + Number(tx.amount));
  }

  const categoryMap = new Map<string, { amount: number; id: string | null }>();
  for (const tx of data || []) {
    const catObj = tx.categories as unknown as { name: string; id?: string } | null;
    const catName = catObj?.name || 'Sem categoria';
    const existing = categoryMap.get(catName);
    if (existing) {
      existing.amount += Number(tx.amount);
    } else {
      categoryMap.set(catName, {
        amount: Number(tx.amount),
        id: catObj ? (tx.category_id as string) : null,
      });
    }
  }

  const sorted = [...categoryMap.entries()]
    .sort((a, b) => b[1].amount - a[1].amount);

  const totalExpenses = sorted.reduce((s, [, v]) => s + v.amount, 0);

  const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#6B7280'];

  const top5 = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const othersSum = rest.reduce((s, [, v]) => s + v.amount, 0);

  const categories = top5.map(([name, { amount, id }], i) => {
    const prevAmount = prevCategoryMap.get(name) || 0;
    const change = prevAmount > 0 ? Math.round(((amount - prevAmount) / prevAmount) * 100) : null;
    return {
      name,
      amount,
      categoryId: id,
      percentage: totalExpenses > 0 ? Number((amount / totalExpenses * 100).toFixed(1)) : 0,
      color: COLORS[i],
      change,
    };
  });

  if (othersSum > 0) {
    // If "Outros" is already in top 5, merge the rest into it instead of duplicating
    const existingOutros = categories.find((c) => c.name === 'Outros');
    if (existingOutros) {
      existingOutros.amount += othersSum;
      existingOutros.percentage = totalExpenses > 0
        ? Number((existingOutros.amount / totalExpenses * 100).toFixed(1))
        : 0;
    } else {
      categories.push({
        name: 'Demais',
        amount: othersSum,
        categoryId: '_others',
        percentage: totalExpenses > 0 ? Number((othersSum / totalExpenses * 100).toFixed(1)) : 0,
        color: COLORS[5],
        change: null,
      });
    }
  }

  return NextResponse.json({ categories }, {
    headers: { 'Cache-Control': 'private, max-age=600, stale-while-revalidate=120' },
  });
});
