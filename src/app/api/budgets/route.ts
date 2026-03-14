import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface BudgetRow {
  id: string;
  category_id: string;
  monthly_limit: number;
  categories: { name: string; icon: string } | null;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get budgets with category names (table not in generated types)
  const { data: budgets, error } = await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
    .from('category_budgets')
    .select('id, category_id, monthly_limit, categories(name, icon)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }

  // Get current month spending per category
  const now = new Date();
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, category_id')
    .eq('user_id', user.id)
    .eq('type', 'debit')
    .gte('date', startDate)
    .lte('date', endDate);

  const spendingMap = new Map<string, number>();
  for (const tx of transactions || []) {
    if (tx.category_id) {
      spendingMap.set(tx.category_id, (spendingMap.get(tx.category_id) || 0) + Number(tx.amount));
    }
  }

  const result = ((budgets || []) as unknown as BudgetRow[]).map((b) => {
    const spent = spendingMap.get(b.category_id) || 0;
    const limit = Number(b.monthly_limit);
    return {
      id: b.id,
      categoryId: b.category_id,
      categoryName: b.categories?.name || 'Desconhecida',
      categoryIcon: b.categories?.icon || '📦',
      monthlyLimit: limit,
      spent,
      percentage: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      status: spent > limit ? 'over' : spent > limit * 0.8 ? 'warning' : 'ok',
    };
  });

  return NextResponse.json({ budgets: result });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { categoryId, monthlyLimit } = body;

  if (!categoryId || !monthlyLimit || monthlyLimit <= 0) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { data, error } = await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
    .from('category_budgets')
    .upsert(
      {
        user_id: user.id,
        category_id: categoryId,
        monthly_limit: monthlyLimit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,category_id' },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 });
  }

  return NextResponse.json({ budget: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const budgetId = searchParams.get('id');

  if (!budgetId) {
    return NextResponse.json({ error: 'Budget ID required' }, { status: 400 });
  }

  const { error } = await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
    .from('category_budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
