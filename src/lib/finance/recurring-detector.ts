import { createClient } from '@supabase/supabase-js';

export interface RecurringResult {
  merchant: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  type: 'subscription' | 'installment' | 'income';
  status: 'active' | 'cancelled' | 'completed';
  confidence: 'high' | 'medium' | 'low';
  installments_remaining?: number;
  next_expected_date: string;
  occurrences: number;
  transaction_pattern: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  merchant: string | null;
  date: string;
  type: 'debit' | 'credit';
}

// Known income sources in Brazil — fast-path classification
const KNOWN_INCOME_SOURCES: string[] = [
  'salario', 'salary', 'folha', 'holerite', 'pagamento',
  'freelance', 'freela', 'pj', 'nota fiscal',
  'aluguel', 'aluguer', 'rent',
  'dividendo', 'rendimento', 'juros', 'yield',
  'pensao', 'aposentadoria', 'inss', 'beneficio',
  'pix recebido', 'transferencia recebida', 'ted recebida', 'doc recebida',
  'reembolso', 'cashback',
];

function isKnownIncomeSource(normalizedMerchant: string): boolean {
  return KNOWN_INCOME_SOURCES.some(known => normalizedMerchant.includes(known));
}

// Excluded merchants — these are NOT recurring expenses (credit card bills, bank transfers, etc.)
const EXCLUDED_MERCHANTS: string[] = [
  'banco', 'bank', 'fatura', 'cartao', 'cartão',
  'pagamento fatura', 'pgto fatura', 'pgto cartao',
  'transferencia', 'transferência', 'ted', 'doc', 'pix',
  'saldo', 'aplicacao', 'aplicação', 'resgate',
  'investimento', 'cdb', 'lci', 'lca', 'tesouro',
  'emprestimo', 'empréstimo', 'financiamento',
  'boleto', 'darf', 'gps', 'imposto', 'taxa',
];

function isExcludedMerchant(normalizedMerchant: string): boolean {
  return EXCLUDED_MERCHANTS.some(excluded => normalizedMerchant.includes(excluded));
}

// Known subscription services in Brazil — fast-path classification
const KNOWN_SUBSCRIPTIONS: string[] = [
  'netflix', 'spotify', 'disney', 'hbo', 'max', 'amazon prime',
  'apple', 'icloud', 'google one', 'google storage', 'youtube premium',
  'youtube music', 'globoplay', 'paramount', 'star+', 'crunchyroll',
  'deezer', 'tidal', 'audible',
  'ifood', 'rappi', 'uber eats', 'uber one', 'uber pass',
  'gympass', 'totalpass', 'smartfit', 'bluefit',
  'adobe', 'microsoft 365', 'office 365', 'dropbox', 'notion',
  'chatgpt', 'openai', 'claude', 'midjourney', 'canva',
  'playstation', 'xbox', 'nintendo', 'steam', 'ea play',
  'duolingo', 'coursera', 'alura', 'rocketseat',
  'nu seguro', 'nubank vida', 'porto seguro', 'sulamerica',
  'claro', 'vivo', 'tim', 'oi',
];

function isKnownSubscription(normalizedMerchant: string): boolean {
  return KNOWN_SUBSCRIPTIONS.some(known => normalizedMerchant.includes(known));
}

function normalizeMerchant(description: string, merchant: string | null): string {
  const name = merchant || description;
  return name
    .replace(/\s+/g, ' ')
    .replace(/\d{2}\/\d{2}/g, '') // Remove date patterns like 01/06
    .replace(/\*+/g, ' ')         // Replace asterisks with space
    .replace(/\b(br|brasil|sao paulo|sp|rj|rio|nova odessa|bra)\b/gi, '') // Remove location suffixes
    // Remove acquirer prefixes (Dm*, Ifd*, Pag*, Mp*, Pagseguro*, etc.)
    .replace(/^(dm|ifd|pag|mp|pagseguro|mercpago|pic|int|ame|stone|cielo|rede|getnet)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isAmountSimilar(a: number, b: number, tolerance = 0.05): boolean {
  if (a === 0 || b === 0) return false;
  return Math.abs(a - b) / Math.max(a, b) <= tolerance;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a + 'T12:00:00').getTime() - new Date(b + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24);
}

function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function detectInstallmentPattern(description: string): { current: number; total: number } | null {
  // Require installment prefixes (parcela, parc, parc.) or pattern at end of string
  // to avoid false positives like "Compra 2/5 itens" or "Sala 101/302"
  const match = description.match(/(?:parcelas?\s*|parc\.?\s*)(\d+)\s*(?:\/|de)\s*(\d+)/i)
    || description.match(/(\d+)\s*(?:\/|de)\s*(\d+)\s*$/i);
  if (match) {
    const current = parseInt(match[1]);
    const total = parseInt(match[2]);
    // Validate: current must be 1..total, total must be 2..48 (reasonable installment range)
    if (current >= 1 && current <= total && total >= 2 && total <= 48) {
      return { current, total };
    }
  }
  return null;
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function hasMultiplePerMonth(transactions: Transaction[]): boolean {
  const monthCounts = new Map<string, number>();
  for (const tx of transactions) {
    const monthKey = tx.date.slice(0, 7); // YYYY-MM
    monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
  }
  const counts = [...monthCounts.values()];
  const avgPerMonth = counts.reduce((a, b) => a + b, 0) / counts.length;
  return avgPerMonth > 1.5;
}

function mapStatus(isActive: boolean, type: 'subscription' | 'installment'): 'active' | 'cancelled' | 'completed' {
  if (isActive) return 'active';
  return type === 'installment' ? 'completed' : 'cancelled';
}

function detectRecurringIncomeFromTransactions(transactions: Transaction[]): RecurringResult[] {
  const results: RecurringResult[] = [];
  const grouped = new Map<string, Transaction[]>();

  // Only process credit (income) transactions
  for (const tx of transactions) {
    if (tx.type !== 'credit') continue;
    const key = normalizeMerchant(tx.description, tx.merchant);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(tx);
  }

  for (const [merchantKey, txs] of grouped) {
    // Skip bank transfers, investments, etc. — not recurring income
    if (isExcludedMerchant(merchantKey)) continue;

    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    const isKnown = isKnownIncomeSource(merchantKey);

    // Need at least 2 occurrences for pattern detection
    if (sorted.length < 2) {
      // Known income source with single recent occurrence
      if (isKnown) {
        const daysSinceLast = daysBetween(latest.date, new Date().toLocaleDateString('en-CA'));
        if (daysSinceLast <= 45) {
          results.push({
            merchant: latest.merchant || latest.description,
            amount: latest.amount,
            frequency: 'monthly',
            type: 'income',
            status: 'active',
            confidence: 'low',
            next_expected_date: addMonths(latest.date, 1),
            occurrences: 1,
            transaction_pattern: `income:${merchantKey}`,
          });
        }
      }
      continue;
    }

    // Calculate intervals and amount statistics
    const intervals: number[] = [];
    const amounts: number[] = sorted.map(tx => tx.amount);

    for (let i = 1; i < sorted.length; i++) {
      intervals.push(daysBetween(sorted[i].date, sorted[i - 1].date));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalStdDev = standardDeviation(intervals);
    const amountCV = coefficientOfVariation(amounts);

    // Check if intervals are roughly monthly (25-35 days)
    const isMonthly = avgInterval >= 25 && avgInterval <= 35;
    if (!isMonthly) continue;

    // Regularity check — irregular intervals = not recurring income
    const isRegular = intervalStdDev <= 10;
    if (!isRegular) continue;

    // Reject if multiple per month (random transfers, not salary)
    if (hasMultiplePerMonth(sorted)) continue;

    const daysSinceLast = daysBetween(latest.date, new Date().toLocaleDateString('en-CA'));
    const isActive = daysSinceLast <= 65;

    // Income can have higher amount variation than subscriptions (bonuses, overtime)
    // Accept up to 40% CV for known sources, 30% for unknown
    const maxCV = isKnown ? 0.40 : 0.30;
    if (amountCV > maxCV) continue;

    let confidence: 'high' | 'medium' | 'low';
    if (isKnown && sorted.length >= 3) confidence = 'high';
    else if (sorted.length >= 3 && amountCV <= 0.10) confidence = 'high';
    else if (sorted.length >= 2) confidence = 'medium';
    else confidence = 'low';

    results.push({
      merchant: latest.merchant || latest.description,
      amount: latest.amount,
      frequency: 'monthly',
      type: 'income',
      status: isActive ? 'active' : 'cancelled',
      confidence,
      next_expected_date: addMonths(latest.date, 1),
      occurrences: sorted.length,
      transaction_pattern: `income:${merchantKey}`,
    });
  }

  return results;
}

export function detectRecurringFromTransactions(transactions: Transaction[]): RecurringResult[] {
  const results: RecurringResult[] = [];
  const grouped = new Map<string, Transaction[]>();

  // Filter credits and group debit by normalized merchant
  for (const tx of transactions) {
    if (tx.type === 'credit') continue;
    const key = normalizeMerchant(tx.description, tx.merchant);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(tx);
  }

  for (const [merchantKey, txs] of grouped) {
    // Skip excluded merchants (credit card bills, bank transfers, investments, etc.)
    if (isExcludedMerchant(merchantKey)) continue;

    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];

    // STEP 1: Installment pattern X/Y has absolute precedence
    const installment = detectInstallmentPattern(sorted[sorted.length - 1].description);
    if (installment) {
      const isActive = installment.current < installment.total;
      results.push({
        merchant: latest.merchant || latest.description,
        amount: latest.amount,
        frequency: 'monthly',
        type: 'installment',
        status: isActive ? 'active' : 'completed',
        confidence: 'high',
        installments_remaining: installment.total - installment.current,
        next_expected_date: isActive
          ? addMonths(latest.date, 1)
          : latest.date,
        occurrences: sorted.length,
        transaction_pattern: `${installment.current}/${installment.total}`,
      });
      continue;
    }

    // Need at least 2 occurrences for pattern detection
    if (sorted.length < 2) {
      // STEP 2: Known subscription with single occurrence in last 45 days
      if (isKnownSubscription(merchantKey)) {
        const daysSinceLast = daysBetween(latest.date, new Date().toLocaleDateString('en-CA'));
        if (daysSinceLast <= 45) {
          results.push({
            merchant: latest.merchant || latest.description,
            amount: latest.amount,
            frequency: 'monthly',
            type: 'subscription',
            status: 'active',
            confidence: 'low',
            next_expected_date: addMonths(latest.date, 1),
            occurrences: 1,
            transaction_pattern: merchantKey,
          });
        }
      }
      continue;
    }

    // STEP 3: Calculate intervals and amount statistics
    const intervals: number[] = [];
    const amounts: number[] = sorted.map(tx => tx.amount);

    for (let i = 1; i < sorted.length; i++) {
      intervals.push(daysBetween(sorted[i].date, sorted[i - 1].date));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalStdDev = standardDeviation(intervals);
    const amountCV = coefficientOfVariation(amounts);

    // Check if intervals are roughly monthly (25-35 days)
    const isMonthly = avgInterval >= 25 && avgInterval <= 35;
    if (!isMonthly) continue;

    // Regularity check — irregular intervals = not subscription
    const isRegular = intervalStdDev <= 10;
    if (!isRegular) continue;

    // Reject if multiple transactions per month (avulse purchases, not subscription)
    if (hasMultiplePerMonth(sorted)) continue;

    // STEP 4: Differentiate installment vs subscription
    const isKnown = isKnownSubscription(merchantKey);
    const daysSinceLast = daysBetween(latest.date, new Date().toLocaleDateString('en-CA'));
    // 65-day threshold accounts for bimonthly billing cycles and delayed charges,
    // preventing monthly subscriptions from being marked "cancelled" too quickly
    const isActive = daysSinceLast <= 65;

    // Known subscriptions with regular interval → subscription (high confidence)
    if (isKnown) {
      results.push({
        merchant: latest.merchant || latest.description,
        amount: latest.amount,
        frequency: 'monthly',
        type: 'subscription',
        status: isActive ? 'active' : 'cancelled',
        confidence: 'high',
        next_expected_date: addMonths(latest.date, 1),
        occurrences: sorted.length,
        transaction_pattern: merchantKey,
      });
      continue;
    }

    // Amount-based classification for unknown merchants
    if (amountCV <= 0.03) {
      const spanMonths = daysBetween(sorted[0].date, sorted[sorted.length - 1].date) / 30;

      if (sorted.length <= 12 && spanMonths < 13 && !isActive) {
        // Finished installment plan
        results.push({
          merchant: latest.merchant || latest.description,
          amount: latest.amount,
          frequency: 'monthly',
          type: 'installment',
          status: 'completed',
          confidence: 'medium',
          installments_remaining: 0,
          next_expected_date: latest.date,
          occurrences: sorted.length,
          transaction_pattern: merchantKey,
        });
      } else if (sorted.length <= 4 && spanMonths < 5) {
        // Few occurrences, short span → likely installment in progress
        results.push({
          merchant: latest.merchant || latest.description,
          amount: latest.amount,
          frequency: 'monthly',
          type: 'installment',
          status: mapStatus(isActive, 'installment'),
          confidence: 'medium',
          installments_remaining: isActive ? Math.max(0, 12 - sorted.length) : 0,
          next_expected_date: isActive ? addMonths(latest.date, 1) : latest.date,
          occurrences: sorted.length,
          transaction_pattern: merchantKey,
        });
      } else {
        // Many occurrences or long span with exact amounts → subscription
        results.push({
          merchant: latest.merchant || latest.description,
          amount: latest.amount,
          frequency: 'monthly',
          type: 'subscription',
          status: isActive ? 'active' : 'cancelled',
          confidence: intervalStdDev <= 5 ? 'high' : 'medium',
          next_expected_date: addMonths(latest.date, 1),
          occurrences: sorted.length,
          transaction_pattern: merchantKey,
        });
      }
    } else if (amountCV <= 0.15) {
      // Slight variation (3-15%) — price adjustments → subscription
      results.push({
        merchant: latest.merchant || latest.description,
        amount: latest.amount,
        frequency: 'monthly',
        type: 'subscription',
        status: isActive ? 'active' : 'cancelled',
        confidence: 'medium',
        next_expected_date: addMonths(latest.date, 1),
        occurrences: sorted.length,
        transaction_pattern: merchantKey,
      });
    } else if (amountCV <= 0.30 && intervalStdDev <= 5) {
      // High variation but very regular interval → variable subscription (phone bill, etc.)
      results.push({
        merchant: latest.merchant || latest.description,
        amount: latest.amount,
        frequency: 'monthly',
        type: 'subscription',
        status: isActive ? 'active' : 'cancelled',
        confidence: 'low',
        next_expected_date: addMonths(latest.date, 1),
        occurrences: sorted.length,
        transaction_pattern: merchantKey,
      });
    }
  }

  // Detect recurring income from credit transactions
  const incomeResults = detectRecurringIncomeFromTransactions(transactions);
  results.push(...incomeResults);

  return results;
}

export async function detectAndSaveRecurring(userId: string): Promise<RecurringResult[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Fetch user's transactions from last 12 months for better pattern detection
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, description, amount, merchant, date, type')
    .eq('user_id', userId)
    .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (!transactions?.length) return [];

  const results = detectRecurringFromTransactions(transactions);

  // Delete old auto-detected records (preserve user overrides)
  await supabase
    .from('recurring_transactions')
    .delete()
    .eq('user_id', userId)
    .is('user_override', null);

  // Insert fresh results
  if (results.length > 0) {
    const rows = results.map(result => ({
      user_id: userId,
      transaction_pattern: result.transaction_pattern,
      merchant: result.merchant,
      amount: result.amount,
      frequency: result.frequency,
      type: result.type,
      installments_remaining: result.installments_remaining ?? null,
      next_expected_date: result.next_expected_date,
      status: result.status,
    }));

    const { error } = await supabase
      .from('recurring_transactions')
      .upsert(rows, { onConflict: 'user_id,transaction_pattern', ignoreDuplicates: false });

    if (error) {
      console.error('[recurring-detector] bulk upsert error:', error.message);
    }
  }

  return results;
}

export { normalizeMerchant, isAmountSimilar, detectInstallmentPattern, coefficientOfVariation, standardDeviation, isKnownSubscription, isKnownIncomeSource, isExcludedMerchant, hasMultiplePerMonth, KNOWN_SUBSCRIPTIONS, KNOWN_INCOME_SOURCES, EXCLUDED_MERCHANTS };
