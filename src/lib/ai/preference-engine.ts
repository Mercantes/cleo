import { createAdminClient } from '@/lib/supabase/admin';

export interface UserPreference {
  key: string;
  value: unknown;
  source: 'explicit' | 'inferred' | 'default';
  confidence: number;
}

const PREFERENCE_PATTERNS: Array<{
  pattern: RegExp;
  key: string;
  extract: (match: RegExpMatchArray) => unknown;
}> = [
  {
    pattern: /prefiro respostas? (curtas?|longas?|detalhadas?|resumidas?)/i,
    key: 'response_style',
    extract: (m) => {
      const style = m[1].toLowerCase();
      if (style.startsWith('curt') || style.startsWith('resumid')) return 'concise';
      return 'detailed';
    },
  },
  {
    pattern: /(?:me )?chame? de [""\u201C\u201D]?([\p{L}\p{M}]+)[""\u201C\u201D]?/iu,
    key: 'nickname',
    extract: (m) => m[1],
  },
  {
    pattern: /(?:não|nao) (?:me )?(?:mostre|mande|envie) (?:gráficos?|visualizaç[ãõ]es?)/i,
    key: 'show_charts',
    extract: () => false,
  },
  {
    pattern: /(?:quero|gostaria de) (?:ver )?(?:mais )?(?:gráficos?|visualizaç[ãõ]es?)/i,
    key: 'show_charts',
    extract: () => true,
  },
  {
    pattern:
      /(?:minha?|meu) (?:prioridade|foco|objetivo) (?:é |principal (?:é )?)(economizar|investir|pagar dívidas?|quitar|guardar dinheiro)/i,
    key: 'financial_goal',
    extract: (m) => {
      const goal = m[1].toLowerCase();
      if (goal.includes('invest')) return 'investing';
      if (goal.includes('dívid') || goal.includes('quitar')) return 'debt_payoff';
      return 'saving';
    },
  },
];

/**
 * Extract explicit preferences from a user message.
 * Returns any preferences found via regex patterns.
 */
export function extractPreferences(message: string): Array<{ key: string; value: unknown }> {
  const found: Array<{ key: string; value: unknown }> = [];

  for (const { pattern, key, extract } of PREFERENCE_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      found.push({ key, value: extract(match) });
    }
  }

  return found;
}

/**
 * Save extracted preferences to the database.
 */
export async function savePreferences(
  userId: string,
  preferences: Array<{ key: string; value: unknown }>,
  source: 'explicit' | 'inferred' = 'explicit',
): Promise<number> {
  if (preferences.length === 0) return 0;

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const rows = preferences.map((p) => ({
    user_id: userId,
    preference_key: p.key,
    preference_value: JSON.stringify(p.value),
    source,
    confidence: source === 'explicit' ? 1.0 : 0.7,
    last_updated: now,
  }));

  const { error } = await supabase.from('user_preferences').upsert(rows, {
    onConflict: 'user_id,preference_key',
  });

  if (error) {
    console.error('[preference-engine] Save error:', error.message);
    return 0;
  }

  return rows.length;
}

/**
 * Load all preferences for a user.
 */
export async function loadPreferences(userId: string): Promise<UserPreference[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('user_preferences')
    .select('preference_key, preference_value, source, confidence')
    .eq('user_id', userId);

  if (!data) return [];

  return data.map((p) => ({
    key: p.preference_key as string,
    value: p.preference_value,
    source: p.source as 'explicit' | 'inferred' | 'default',
    confidence: Number(p.confidence),
  }));
}

/**
 * Build a personalization context string for the system prompt.
 */
export async function getPersonalizationContext(userId: string): Promise<string> {
  const preferences = await loadPreferences(userId);
  if (preferences.length === 0) return '';

  const lines: string[] = ['', '--- Preferências do Usuário ---'];

  for (const pref of preferences) {
    switch (pref.key) {
      case 'response_style':
        lines.push(
          `Estilo de resposta preferido: ${pref.value === 'concise' ? 'curto e direto' : 'detalhado'}`,
        );
        break;
      case 'nickname':
        lines.push(`Apelido preferido: ${pref.value}`);
        break;
      case 'show_charts':
        lines.push(`Gráficos: ${pref.value ? 'sim, incluir quando relevante' : 'não incluir'}`);
        break;
      case 'financial_goal':
        lines.push(
          `Objetivo financeiro principal: ${
            pref.value === 'investing'
              ? 'investir'
              : pref.value === 'debt_payoff'
                ? 'pagar dívidas'
                : 'economizar'
          }`,
        );
        break;
      default:
        lines.push(`${pref.key}: ${JSON.stringify(pref.value)}`);
    }
  }

  return lines.join('\n');
}
