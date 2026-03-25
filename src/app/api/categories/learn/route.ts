import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordCategoryCorrection } from '@/lib/ai/learning-engine';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { transaction_id, new_category_id } = body;

  if (!transaction_id || !new_category_id) {
    return NextResponse.json(
      { error: 'transaction_id and new_category_id are required' },
      { status: 400 },
    );
  }

  // Fetch transaction details
  const { data: transaction } = await supabase
    .from('transactions')
    .select('id, description, merchant, category_id')
    .eq('id', transaction_id)
    .eq('user_id', user.id)
    .single();

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  // Update the transaction category
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ category_id: new_category_id, category_confidence: 1.0 })
    .eq('id', transaction_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Record the learning event
  const result = await recordCategoryCorrection(
    user.id,
    transaction_id,
    transaction.description || '',
    transaction.merchant || null,
    transaction.category_id || null,
    new_category_id,
  );

  return NextResponse.json({
    success: true,
    auto_rule_created: result.autoRuleCreated,
    retroactive_count: result.retroactiveCount,
  });
}
