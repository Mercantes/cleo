import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (_request, { supabase, user }) => {
  const now = new Date();
  const months: { month: string; label: string; income: number; expenses: number }[] = [];

  const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    const txs = data || [];
    months.push({
      month: `${year}-${String(month).padStart(2, '0')}`,
      label: MONTH_NAMES[month - 1],
      income: txs.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0),
      expenses: txs.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0),
    });
  }

  return NextResponse.json({ months }, {
    headers: { 'Cache-Control': 'private, max-age=600, stale-while-revalidate=120' },
  });
});
