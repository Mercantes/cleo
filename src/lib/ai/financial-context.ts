import { createClient } from '@supabase/supabase-js';

const contextCache = new Map<string, { data: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function buildFinancialContext(userId: string): Promise<string> {
  const cached = contextCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [profileResult, transactionsResult, recurringResult, accountsResult] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', userId).single(),
    supabase
      .from('transactions')
      .select('amount, type, categories(name)')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd),
    supabase
      .from('recurring_transactions')
      .select('merchant, amount, type, frequency')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase.from('accounts').select('name, balance, type').eq('user_id', userId),
  ]);

  const name = profileResult.data?.full_name || 'Usuário';
  const transactions = transactionsResult.data || [];
  const recurring = recurringResult.data || [];
  const accounts = accountsResult.data || [];

  // Calculate summary
  const income = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expenses;

  // Top categories
  const categoryMap = new Map<string, number>();
  for (const tx of transactions.filter((t) => t.type === 'debit')) {
    const catObj = tx.categories as unknown as { name: string } | null;
    const cat = catObj?.name || 'Outros';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(tx.amount));
  }
  const topCategories = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Format context
  const lines: string[] = [
    `Nome: ${name}`,
    `Mês atual: ${now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`,
    '',
    '--- Resumo do Mês ---',
    `Receita total: R$ ${income.toFixed(2)}`,
    `Despesas totais: R$ ${expenses.toFixed(2)}`,
    `Saldo do mês: R$ ${balance.toFixed(2)}`,
  ];

  if (topCategories.length > 0) {
    lines.push('', '--- Top Categorias de Gastos ---');
    for (const [cat, amount] of topCategories) {
      lines.push(`- ${cat}: R$ ${amount.toFixed(2)}`);
    }
  }

  if (recurring.length > 0) {
    lines.push('', '--- Recorrências Ativas ---');
    for (const r of recurring) {
      const typeLabel = r.type === 'subscription' ? 'Assinatura' : 'Parcela';
      lines.push(`- ${r.merchant}: R$ ${Number(r.amount).toFixed(2)}/mês (${typeLabel})`);
    }
  }

  if (accounts.length > 0) {
    lines.push('', '--- Contas ---');
    for (const acc of accounts) {
      lines.push(`- ${acc.name} (${acc.type}): R$ ${Number(acc.balance).toFixed(2)}`);
    }
  }

  const context = lines.join('\n');
  contextCache.set(userId, { data: context, expiresAt: Date.now() + CACHE_TTL_MS });

  return context;
}

export function clearContextCache(userId?: string) {
  if (userId) {
    contextCache.delete(userId);
  } else {
    contextCache.clear();
  }
}
