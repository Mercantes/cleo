import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (_request, { supabase, user }) => {
  const now = new Date();
  const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Calculate date range for all 6 months in one query
  const oldest = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startDate = `${oldest.getFullYear()}-${String(oldest.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data } = await supabase
    .from('transactions')
    .select('amount, type, date')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  const txs = data || [];

  // Group by month
  const months: { month: string; label: string; income: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    const monthTxs = txs.filter((t) => t.date.startsWith(monthKey));
    months.push({
      month: monthKey,
      label: MONTH_NAMES[month - 1],
      income: monthTxs.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0),
      expenses: monthTxs.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0),
    });
  }

  return NextResponse.json({ months }, {
    headers: { 'Cache-Control': 'private, max-age=600, stale-while-revalidate=120' },
  });
});
