import { createClient } from '@supabase/supabase-js';

const BATCH_SIZE = 50;

// Rule-based pre-categorization: substring match (case-insensitive) → category name
const MERCHANT_CATEGORY_RULES: Record<string, string[]> = {
  'Alimentação': [
    'ifood', 'ifd*', 'uber eats', 'rappi', 'zé delivery', 'ze delivery',
    '99food', '99 food',
    'mcdonalds', 'mcdonald', 'burger king', 'subway', 'starbucks',
    'restaurante', 'rest ', 'lanchonete', 'padaria', 'pizzaria', 'açougue',
    'esfiha', 'churrascaria', 'cafeteria', 'cafe ',
    'supermercado', 'mercado', 'hortifruti', 'pao de acucar', 'carrefour',
    'assai', 'atacadao', 'extra', 'dia supermercado', 'sams club',
    'bebidas e alimento', 'meat', 'frango',
  ],
  'Transporte': [
    'uber ', 'uber trip', '99 ', '99app', 'cabify', 'lyft',
    'posto', 'combustivel', 'combustível', 'shell', 'ipiranga', 'br distribuidora',
    'estacionamento', 'parking', 'multipark', 'park ', 'pedagio', 'pedágio', 'sem parar',
    'recarga bilhete', 'metro ', 'metrô',
    'porto seguro auto', 'seguro auto',
  ],
  'Assinaturas': [
    'netflix', 'spotify', 'amazon prime', 'amazon ad free', 'disney', 'hbo', 'star+',
    'youtube premium', 'apple.com', 'applecombill', 'google storage', 'icloud',
    'deezer', 'globoplay', 'paramount', 'crunchyroll',
    'wellhub', 'gympass',
  ],
  'Saúde': [
    'farmacia', 'farmácia', 'drogaria', 'drogasil', 'droga raia', 'drogal',
    'raia drogasil', 'panvel', 'unimed', 'amil', 'sulamerica',
    'hapvida', 'notredame', 'hospital', 'clinica', 'clínica',
    'laboratório', 'laboratorio', 'dentista', 'odonto',
  ],
  'Educação': [
    'udemy', 'coursera', 'alura', 'escola', 'faculdade', 'universidade',
    'curso ', 'mensalidade escolar', 'livrar', 'saraiva', 'amazon kindle',
  ],
  'Moradia': [
    'aluguel', 'condominio', 'condomínio', 'iptu', 'luz', 'energia',
    'enel', 'cemig', 'copel', 'eletropaulo', 'sabesp', 'agua ',
    'água ', 'gas ', 'gás ', 'internet', 'claro', 'vivo', 'tim', 'oi ',
    'pisos', 'materiais',
  ],
  'Compras': [
    'amazonmktplc', 'amazon br', 'americanas', 'magazine luiza', 'magalu',
    'shopee', 'mercado livre', 'aliexpress', 'shein',
    'shoes', 'clothing', 'renner', 'riachuelo', 'c&a', 'zara',
    'shopping', 'sh park',
  ],
  'Receita': [
    'salario', 'salário', 'pagamento recebido', 'pix recebido',
    'transferencia recebida', 'transferência recebida', 'rendimento',
    'dividendo', 'reembolso', 'cashback',
  ],
  'Lazer': [
    'arena beach', 'cinema', 'teatro', 'ingresso', 'show ',
    'barbershop', 'barbearia', 'salao', 'salão',
  ],
};

function preCategorize(
  transactions: TransactionToCategorize[],
): Map<number, string> {
  const matches = new Map<number, string>();

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const text = `${tx.description} `.toLowerCase();

    for (const [category, patterns] of Object.entries(MERCHANT_CATEGORY_RULES)) {
      if (patterns.some((p) => text.includes(p))) {
        matches.set(i, category);
        break;
      }
    }
  }

  return matches;
}

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Compras',
  'Assinaturas',
  'Receita',
  'Transferência',
  'Investimentos',
  'Outros',
] as const;

interface TransactionToCategorize {
  id: string;
  description: string;
  amount: number;
  type: string;
}

interface CategorizationResult {
  index: number;
  category: string;
  confidence: number;
}

function buildPrompt(transactions: TransactionToCategorize[]): string {
  const txList = transactions
    .map(
      (tx, i) =>
        `${i + 1}. "${tx.description}" R$${tx.amount.toFixed(2)} (${tx.type})`,
    )
    .join('\n');

  return `Categorize estas transações bancárias brasileiras. Para cada uma, retorne APENAS um JSON array.

Categorias válidas: ${CATEGORIES.join(', ')}

Transações:
${txList}

Responda APENAS com um JSON array no formato:
[{"index": 1, "category": "Alimentação", "confidence": 0.95}, ...]

Regras:
- "confidence" deve ser entre 0.0 e 1.0
- Use "Outros" quando incerto
- Considere: IFOOD/restaurantes → Alimentação, UBER/99 → Transporte, Netflix/Spotify → Assinaturas, PIX recebido/salário → Receita`;
}

function parseAIResponse(text: string): CategorizationResult[] {
  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

export async function categorizeTransactions(
  transactions: TransactionToCategorize[],
  userId?: string,
): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[categorize] ANTHROPIC_API_KEY not set');
    return 0;
  }
  if (transactions.length === 0) return 0;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Load categories from DB for UUID mapping
  const { data: dbCategories, error: catError } = await supabase
    .from('categories')
    .select('id, name');

  if (!dbCategories) {
    console.error('[categorize] failed to load categories:', catError?.message);
    return 0;
  }

  const categoryMap = new Map(dbCategories.map((c) => [c.name, c.id]));
  let categorized = 0;

  // Phase 0: User-defined rules (highest priority, confidence 1.0)
  const userRuleMatched = new Set<number>();
  if (userId) {
    const { data: userRules } = await supabase
      .from('user_category_rules')
      .select('merchant_pattern, category_id, match_type')
      .eq('user_id', userId);

    if (userRules && userRules.length > 0) {
      // Group matched transaction IDs by category for batch updates
      const batchByCategoryId = new Map<string, string[]>();

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const text = `${tx.description} `.toLowerCase();

        for (const rule of userRules) {
          const pattern = rule.merchant_pattern.toLowerCase();
          const matched = rule.match_type === 'exact'
            ? text.trim() === pattern
            : text.includes(pattern);

          if (matched) {
            const ids = batchByCategoryId.get(rule.category_id) || [];
            ids.push(tx.id);
            batchByCategoryId.set(rule.category_id, ids);
            userRuleMatched.add(i);
            break;
          }
        }
      }

      // Execute batch updates per category
      for (const [catId, ids] of batchByCategoryId) {
        const { error } = await supabase
          .from('transactions')
          .update({ category_id: catId, category_confidence: 1.0 })
          .in('id', ids);
        if (!error) categorized += ids.length;
      }
    }
  }

  // Phase 1: Rule-based pre-categorization (free, no API calls)
  const ruleMatches = preCategorize(transactions);
  const needsAI: TransactionToCategorize[] = [];
  const ruleBatch = new Map<string, string[]>(); // categoryId -> txIds

  for (let i = 0; i < transactions.length; i++) {
    if (userRuleMatched.has(i)) continue; // Already handled by Phase 0
    const ruleCategoryName = ruleMatches.get(i);
    if (ruleCategoryName) {
      const categoryId = categoryMap.get(ruleCategoryName);
      if (categoryId) {
        const ids = ruleBatch.get(categoryId) || [];
        ids.push(transactions[i].id);
        ruleBatch.set(categoryId, ids);
        continue;
      }
    }
    needsAI.push(transactions[i]);
  }

  // Batch update Phase 1 matches
  for (const [catId, ids] of ruleBatch) {
    const { error } = await supabase
      .from('transactions')
      .update({ category_id: catId, category_confidence: 0.85 })
      .in('id', ids);
    if (!error) categorized += ids.length;
  }

  // Phase 2: AI categorization for remaining transactions
  for (let i = 0; i < needsAI.length; i += BATCH_SIZE) {
    const batch = needsAI.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: buildPrompt(batch) }],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error(`[categorize] Anthropic API error: status=${response.status} body=${errBody.slice(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const results = parseAIResponse(text);

      const batchIndex = Math.floor(i / BATCH_SIZE);
      console.log(`[categorize] batch=${batchIndex} needsAI=${batch.length} aiResults=${results.length}`);

      // Update transactions with categories
      for (const result of results) {
        const tx = batch[result.index - 1];
        if (!tx) continue;

        const categoryId = categoryMap.get(result.category);
        if (!categoryId) continue;

        const { error } = await supabase
          .from('transactions')
          .update({
            category_id: categoryId,
            category_confidence: result.confidence,
          })
          .eq('id', tx.id);

        if (!error) categorized++;
      }
    } catch {
      // Skip batch on error — leave uncategorized
      continue;
    }
  }

  return categorized;
}

export { buildPrompt, parseAIResponse, preCategorize, CATEGORIES, MERCHANT_CATEGORY_RULES };
