import { createClient } from '@supabase/supabase-js';

const BATCH_SIZE = 50;

// Rule-based pre-categorization: substring match (case-insensitive) → category name
const MERCHANT_CATEGORY_RULES: Record<string, string[]> = {
  'Alimentação': [
    'ifood', 'uber eats', 'rappi', 'zé delivery', 'ze delivery',
    'mcdonalds', 'mcdonald', 'burger king', 'subway', 'starbucks',
    'restaurante', 'lanchonete', 'padaria', 'pizzaria', 'açougue',
    'supermercado', 'mercado', 'hortifruti', 'pao de acucar', 'carrefour',
    'assai', 'atacadao', 'extra', 'dia supermercado', 'sams club',
  ],
  'Transporte': [
    'uber ', 'uber trip', '99 ', '99app', 'cabify', 'lyft',
    'posto', 'combustivel', 'combustível', 'shell', 'ipiranga', 'br distribuidora',
    'estacionamento', 'parking', 'pedagio', 'pedágio', 'sem parar',
    'recarga bilhete', 'metro ', 'metrô',
  ],
  'Assinaturas': [
    'netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'star+',
    'youtube premium', 'apple.com', 'google storage', 'icloud',
    'deezer', 'globoplay', 'paramount', 'crunchyroll',
  ],
  'Saúde': [
    'farmacia', 'farmácia', 'drogaria', 'drogasil', 'droga raia',
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
  ],
  'Receita': [
    'salario', 'salário', 'pagamento recebido', 'pix recebido',
    'transferencia recebida', 'transferência recebida', 'rendimento',
    'dividendo', 'reembolso', 'cashback',
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
): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || transactions.length === 0) return 0;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Load categories from DB for UUID mapping
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('id, name');

  if (!dbCategories) return 0;

  const categoryMap = new Map(dbCategories.map((c) => [c.name, c.id]));
  let categorized = 0;

  // Phase 1: Rule-based pre-categorization (free, no API calls)
  const ruleMatches = preCategorize(transactions);
  const needsAI: TransactionToCategorize[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const ruleCategoryName = ruleMatches.get(i);
    if (ruleCategoryName) {
      const categoryId = categoryMap.get(ruleCategoryName);
      if (categoryId) {
        const { error } = await supabase
          .from('transactions')
          .update({ category_id: categoryId, category_confidence: 0.85 })
          .eq('id', transactions[i].id);
        if (!error) categorized++;
        continue;
      }
    }
    needsAI.push(transactions[i]);
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

      if (!response.ok) continue;

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const results = parseAIResponse(text);

      // Log token usage for cost monitoring (dev only)
      if (process.env.NODE_ENV === 'development') {
        const usage = data.usage;
        if (usage) {
          const batchIndex = Math.floor(i / BATCH_SIZE);
          const estimatedCost = (usage.input_tokens * 0.25 + usage.output_tokens * 1.25) / 1_000_000;
          console.log(
            `[categorize] batch=${batchIndex} tokens_in=${usage.input_tokens} tokens_out=${usage.output_tokens} cost_usd=${estimatedCost.toFixed(6)}`,
          );
        }
      }

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
