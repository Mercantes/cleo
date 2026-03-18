import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '@/lib/utils/format';

const contextCache = new Map<string, { data: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Strip control chars and prompt injection patterns from user-controlled strings */
function sanitize(text: string): string {
  return text
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    .replace(/#{2,}/g, '')
    .replace(/<[^>]*>/g, '')
    .slice(0, 100);
}

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

  // Previous month dates for trend comparison
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const prevStart = `${prevMonthStart.getFullYear()}-${String(prevMonthStart.getMonth() + 1).padStart(2, '0')}-01`;
  const prevEnd = prevMonthEnd.toISOString().split('T')[0];

  const [profileResult, transactionsResult, prevTransactionsResult, recurringResult, accountsResult, goalsResult, challengesResult, budgetsResult] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', userId).single(),
    supabase
      .from('transactions')
      .select('amount, type, categories(name)')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd),
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('date', prevStart)
      .lte('date', prevEnd),
    supabase
      .from('recurring_transactions')
      .select('merchant, amount, type, frequency')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase.from('accounts').select('name, balance, type').eq('user_id', userId),
    supabase.from('goals').select('monthly_savings_target, retirement_age_target, streak_months, level, xp, total_challenges_completed').eq('user_id', userId).single(),
    supabase.from('challenges').select('title, status, end_date').eq('user_id', userId).eq('status', 'active'),
    supabase.from('category_budgets').select('monthly_limit, categories(name)').eq('user_id', userId),
  ]);

  const name = sanitize(profileResult.data?.full_name || 'Usuário');
  const transactions = transactionsResult.data || [];
  const prevTransactions = prevTransactionsResult.data || [];
  const recurring = recurringResult.data || [];
  const accounts = accountsResult.data || [];
  const goals = goalsResult.data;
  const activeChallenges = challengesResult.data || [];
  const budgets = budgetsResult.data || [];

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
    const cat = sanitize(catObj?.name || 'Outros');
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
    `Receita total: ${formatCurrency(income)}`,
    `Despesas totais: ${formatCurrency(expenses)}`,
    `Saldo do mês: ${formatCurrency(balance)}`,
  ];

  // Previous month comparison
  const prevIncome = prevTransactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + Number(t.amount), 0);
  const prevExpenses = prevTransactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + Number(t.amount), 0);

  if (prevExpenses > 0) {
    const expenseChange = expenses > 0 ? Math.round(((expenses - prevExpenses) / prevExpenses) * 100) : 0;
    lines.push(`Despesas mês anterior: ${formatCurrency(prevExpenses)} (${expenseChange > 0 ? '+' : ''}${expenseChange}% vs atual)`);
    lines.push(`Receita mês anterior: ${formatCurrency(prevIncome)}`);
  }

  if (topCategories.length > 0) {
    lines.push('', '--- Top Categorias de Gastos ---');
    for (const [cat, amount] of topCategories) {
      lines.push(`- ${cat}: ${formatCurrency(amount)}`);
    }
  }

  // Budgets
  if (budgets.length > 0) {
    lines.push('', '--- Orçamentos por Categoria ---');
    for (const b of budgets) {
      const catObj = b.categories as unknown as { name: string } | null;
      const catName = sanitize(catObj?.name || 'Desconhecida');
      const limit = Number(b.monthly_limit);
      const spent = categoryMap.get(catName) || 0;
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const status = pct > 100 ? 'ESTOURADO' : pct > 80 ? 'ATENÇÃO' : 'OK';
      lines.push(`- ${catName}: ${formatCurrency(spent)}/${formatCurrency(limit)} (${pct}%) [${status}]`);
    }
  }

  if (recurring.length > 0) {
    lines.push('', '--- Recorrências Ativas ---');
    for (const r of recurring) {
      const typeLabel = r.type === 'subscription' ? 'Assinatura' : 'Parcela';
      lines.push(`- ${sanitize(r.merchant)}: ${formatCurrency(Number(r.amount))}/mês (${typeLabel})`);
    }
  }

  if (accounts.length > 0) {
    lines.push('', '--- Contas ---');
    for (const acc of accounts) {
      lines.push(`- ${sanitize(acc.name)} (${acc.type}): ${formatCurrency(Number(acc.balance))}`);
    }
  }

  // Goals & Gamification
  if (goals?.monthly_savings_target) {
    const savingsTarget = Number(goals.monthly_savings_target);
    const currentSavings = Math.max(0, balance);
    const savingsProgress = savingsTarget > 0 ? Math.round((currentSavings / savingsTarget) * 100) : 0;
    lines.push('', '--- Metas e Gamificação ---');
    lines.push(`Meta mensal de economia: ${formatCurrency(savingsTarget)}`);
    lines.push(`Economia atual no mês: ${formatCurrency(currentSavings)} (${Math.min(savingsProgress, 100)}%)`);
    if (goals.level) lines.push(`Nível: ${goals.level} (${goals.xp || 0} XP)`);
    if (goals.streak_months) lines.push(`Sequência: ${goals.streak_months} meses consecutivos atingindo a meta`);
    if (goals.total_challenges_completed) lines.push(`Desafios completados: ${goals.total_challenges_completed}`);
  }

  if (activeChallenges.length > 0) {
    lines.push('', '--- Desafios Ativos ---');
    for (const c of activeChallenges) {
      const daysLeft = Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      lines.push(`- ${sanitize(c.title)} (${daysLeft} dias restantes)`);
    }
  }

  // Financial health score (simplified calculation matching dashboard)
  if (income > 0) {
    const savingsRate = ((income - expenses) / income) * 100;
    const recurringTotal = recurring.reduce((s, r) => s + Number(r.amount), 0);
    const recurringPercent = Math.round((recurringTotal / income) * 100);
    let healthScore = 50;
    if (savingsRate >= 20) healthScore += 30;
    else if (savingsRate >= 10) healthScore += 15;
    if (prevExpenses > 0 && expenses < prevExpenses * 0.95) healthScore += 10;
    else if (prevExpenses > 0 && expenses > prevExpenses * 1.15) healthScore -= 10;
    if (recurringPercent <= 30) healthScore += 5;
    else if (recurringPercent > 50) healthScore -= 5;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const label = healthScore >= 80 ? 'Excelente' : healthScore >= 60 ? 'Boa' : healthScore >= 40 ? 'Regular' : 'Precisa de atenção';
    lines.push('', '--- Saúde Financeira ---');
    lines.push(`Pontuação: ${healthScore}/100 (${label})`);
    lines.push(`Taxa de economia: ${Math.round(savingsRate)}%`);
    lines.push(`Gastos fixos: ${recurringPercent}% da renda`);
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
