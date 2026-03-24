import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { parseBody } from '@/lib/validations/api';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const createRuleSchema = z.object({
  merchant_pattern: z.string().trim().min(3, 'Padrão deve ter pelo menos 3 caracteres').max(200),
  category_id: z.string().uuid('ID de categoria inválido'),
  match_type: z.enum(['contains', 'exact']).default('contains'),
  apply_retroactively: z.boolean().default(false),
});

export const GET = withAuth(async (_request, { supabase, user }) => {
  const { data: rules, error } = await supabase
    .from('user_category_rules')
    .select('id, merchant_pattern, match_type, created_at, category_id, categories(id, name, icon)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[category-rules] list failed:', error.message);
    return NextResponse.json({ error: 'Failed to load rules' }, { status: 500 });
  }

  return NextResponse.json({ rules: rules || [] });
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  const body = await request.json();
  const parsed = parseBody(createRuleSchema, body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || 'Dados inválidos' }, { status: 400 });
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: rule, error } = await serviceClient
    .from('user_category_rules')
    .upsert(
      {
        user_id: user.id,
        merchant_pattern: parsed.data.merchant_pattern.toLowerCase(),
        category_id: parsed.data.category_id,
        match_type: parsed.data.match_type,
      },
      { onConflict: 'user_id,merchant_pattern' },
    )
    .select('id, merchant_pattern, match_type, category_id')
    .single();

  if (error) {
    console.error('[category-rules] create failed:', error.message);
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }

  let updated_count = 0;

  if (parsed.data.apply_retroactively) {
    const pattern = parsed.data.merchant_pattern.toLowerCase();
    const matchType = parsed.data.match_type;

    // Find matching transactions
    const { data: transactions } = await serviceClient
      .from('transactions')
      .select('id, description, merchant_name')
      .eq('user_id', user.id)
      .neq('category_id', parsed.data.category_id);

    if (transactions) {
      const matchingIds = transactions
        .filter((tx) => {
          const text = `${tx.description} ${tx.merchant_name || ''}`.toLowerCase();
          return matchType === 'exact' ? text === pattern : text.includes(pattern);
        })
        .map((tx) => tx.id);

      if (matchingIds.length > 0) {
        // Update in batches of 100 to avoid query limits
        for (let i = 0; i < matchingIds.length; i += 100) {
          const batch = matchingIds.slice(i, i + 100);
          await serviceClient
            .from('transactions')
            .update({ category_id: parsed.data.category_id, category_confidence: 1.0 })
            .in('id', batch);
        }
        updated_count = matchingIds.length;
      }
    }
  }

  return NextResponse.json({ rule, updated_count });
});
