import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

export const GET = withAuth(async (request: NextRequest, { supabase, user }) => {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabase
    .from('transactions')
    .select('date, description, merchant, amount, type, categories(name)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(5000);

  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }

  const rows = (data || []) as unknown as Array<{
    date: string;
    description: string;
    merchant: string | null;
    amount: number;
    type: string;
    categories: { name: string } | null;
  }>;

  const csvHeader = 'Data;Descrição;Comerciante;Valor;Tipo;Categoria';
  const csvRows = rows.map(tx => {
    const date = tx.date;
    const desc = escapeCsvField(tx.description);
    const merchant = escapeCsvField(tx.merchant || '');
    const amount = Number(tx.amount).toFixed(2).replace('.', ',');
    const type = tx.type === 'credit' ? 'Receita' : 'Despesa';
    const category = tx.categories?.name || 'Sem categoria';
    return `${date};${desc};${merchant};${amount};${type};${category}`;
  });

  const csv = [csvHeader, ...csvRows].join('\n');
  const bom = '\uFEFF';

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cleo-transacoes-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
});

function escapeCsvField(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
