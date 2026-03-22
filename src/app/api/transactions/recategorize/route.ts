import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { categorizeTransactions } from '@/lib/ai/categorize';

export const maxDuration = 60;

export const POST = withAuth(async (_request, { supabase, user }) => {
  const { data: uncategorized, error } = await supabase
    .from('transactions')
    .select('id, description, amount, type')
    .eq('user_id', user.id)
    .is('category_id', null)
    .limit(200);

  if (error) {
    console.error('[recategorize] query failed:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!uncategorized || uncategorized.length === 0) {
    return NextResponse.json({ categorized: 0, total: 0 });
  }

  const categorized = await categorizeTransactions(uncategorized);

  return NextResponse.json({
    categorized,
    total: uncategorized.length,
  });
});
