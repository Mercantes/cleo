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

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, categories(name)')
    .eq('user_id', user.id)
    .eq('type', 'debit')
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const categoryMap = new Map<string, number>();
  for (const tx of data || []) {
    const catObj = tx.categories as { name: string } | null;
    const cat = catObj?.name || 'Outros';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(tx.amount));
  }

  const sorted = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1]);

  const totalExpenses = sorted.reduce((s, [, v]) => s + v, 0);

  const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#6B7280'];

  const top5 = sorted.slice(0, 5);
  const othersSum = sorted.slice(5).reduce((s, [, v]) => s + v, 0);

  const categories = top5.map(([name, amount], i) => ({
    name,
    amount,
    percentage: totalExpenses > 0 ? Number((amount / totalExpenses * 100).toFixed(1)) : 0,
    color: COLORS[i],
  }));

  if (othersSum > 0) {
    categories.push({
      name: 'Outros',
      amount: othersSum,
      percentage: totalExpenses > 0 ? Number((othersSum / totalExpenses * 100).toFixed(1)) : 0,
      color: COLORS[5],
    });
  }

  return NextResponse.json({ categories });
}
