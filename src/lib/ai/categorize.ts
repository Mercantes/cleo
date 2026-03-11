import { createClient } from '@supabase/supabase-js';

const BATCH_SIZE = 50;

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

  // Process in batches
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);

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

export { buildPrompt, parseAIResponse, CATEGORIES };
