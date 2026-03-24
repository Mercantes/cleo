import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { parseBody } from '@/lib/validations/api';
import { z } from 'zod';

function extractId(request: NextRequest): string | null {
  const url = new URL(request.url);
  return url.pathname.split('/').pop() || null;
}

const updateRuleSchema = z.object({
  merchant_pattern: z.string().trim().min(3).max(200).optional(),
  category_id: z.string().uuid().optional(),
  match_type: z.enum(['contains', 'exact']).optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'Pelo menos um campo é necessário' });

export const PATCH = withAuth(async (request: NextRequest, { supabase, user }) => {
  const id = extractId(request);
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = parseBody(updateRuleSchema, body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || 'Dados inválidos' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.merchant_pattern) update.merchant_pattern = parsed.data.merchant_pattern.toLowerCase();
  if (parsed.data.category_id) update.category_id = parsed.data.category_id;
  if (parsed.data.match_type) update.match_type = parsed.data.match_type;

  const { data: rule, error } = await supabase
    .from('user_category_rules')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, merchant_pattern, match_type, category_id')
    .single();

  if (error) {
    console.error('[category-rules] update failed:', error.message);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }

  return NextResponse.json({ rule });
});

export const DELETE = withAuth(async (request: NextRequest, { supabase, user }) => {
  const id = extractId(request);
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_category_rules')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[category-rules] delete failed:', error.message);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
