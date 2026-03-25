import { createAdminClient } from '@/lib/supabase/admin';

const AUTO_RULE_THRESHOLD = 2;

/**
 * Normalize merchant name for pattern matching.
 * Reuses the same logic as recurring-detector for consistency.
 */
export function normalizeMerchantForLearning(description: string, merchant: string | null): string {
  const name = merchant || description;
  return name
    .replace(/\s+/g, ' ')
    .replace(/\d{2}\/\d{2}/g, '')
    .replace(/\*+/g, ' ')
    .replace(/\b(br|brasil|sao paulo|sp|rj|rio|nova odessa|bra)\b/gi, '')
    .replace(/^(dm|ifd|pag|mp|pagseguro|mercpago|pic|int|ame|stone|cielo|rede|getnet)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Record a category correction and auto-create rules when threshold is met.
 * Returns true if an auto-rule was created.
 */
export async function recordCategoryCorrection(
  userId: string,
  transactionId: string,
  description: string,
  merchant: string | null,
  oldCategoryId: string | null,
  newCategoryId: string,
): Promise<{ autoRuleCreated: boolean; retroactiveCount: number }> {
  const supabase = createAdminClient();
  const pattern = normalizeMerchantForLearning(description, merchant);

  // Record the learning event
  await supabase.from('learning_events').insert({
    user_id: userId,
    event_type: 'category_correction',
    entity_id: transactionId,
    entity_type: 'transaction',
    old_value: oldCategoryId ? { category_id: oldCategoryId } : null,
    new_value: { category_id: newCategoryId },
    merchant_pattern: pattern,
  });

  // Check if we've reached the threshold for this user+pattern+category combo
  const { count } = await supabase
    .from('learning_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'category_correction')
    .eq('merchant_pattern', pattern)
    .eq('new_value->category_id', newCategoryId);

  const correctionCount = count || 0;

  if (correctionCount >= AUTO_RULE_THRESHOLD) {
    return await checkAndCreateRule(userId, pattern, newCategoryId);
  }

  return { autoRuleCreated: false, retroactiveCount: 0 };
}

/**
 * Check if rule already exists, create if not, and apply retroactively.
 */
async function checkAndCreateRule(
  userId: string,
  pattern: string,
  categoryId: string,
): Promise<{ autoRuleCreated: boolean; retroactiveCount: number }> {
  const supabase = createAdminClient();

  // Check if rule already exists for this pattern
  const { data: existingRule } = await supabase
    .from('user_category_rules')
    .select('id, category_id')
    .eq('user_id', userId)
    .eq('merchant_pattern', pattern)
    .single();

  if (existingRule) {
    // Rule exists — update if category changed
    if (existingRule.category_id !== categoryId) {
      await supabase
        .from('user_category_rules')
        .update({ category_id: categoryId })
        .eq('id', existingRule.id);
    }
    return { autoRuleCreated: false, retroactiveCount: 0 };
  }

  // Create auto-rule
  await supabase.from('user_category_rules').insert({
    user_id: userId,
    merchant_pattern: pattern,
    category_id: categoryId,
    match_type: 'contains',
  });

  // Mark learning events as having generated a rule
  await supabase
    .from('learning_events')
    .update({ auto_rule_created: true })
    .eq('user_id', userId)
    .eq('event_type', 'category_correction')
    .eq('merchant_pattern', pattern);

  // Apply retroactively via RPC
  const ilikePattern = `%${pattern}%`;
  const { data: retroCount } = await supabase.rpc('apply_category_rule_retroactively', {
    p_user_id: userId,
    p_pattern: ilikePattern,
    p_match_type: 'contains',
    p_category_id: categoryId,
  });

  return {
    autoRuleCreated: true,
    retroactiveCount: typeof retroCount === 'number' ? retroCount : 0,
  };
}
