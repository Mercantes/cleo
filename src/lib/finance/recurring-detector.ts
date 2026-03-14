import { createClient } from '@supabase/supabase-js';

export interface RecurringResult {
  merchant: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  type: 'subscription' | 'installment';
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

function normalizeMerchant(description: string, merchant: string | null): string {
  const name = merchant || description;
  return name
    .replace(/\s+/g, ' ')
    .replace(/\d{2}\/\d{2}/g, '') // Remove date patterns
    .replace(/\*+/g, ' ')
    .trim()
    .toLowerCase();
}

function isAmountSimilar(a: number, b: number, tolerance = 0.05): boolean {
  if (a === 0 || b === 0) return false;
  return Math.abs(a - b) / Math.max(a, b) <= tolerance;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24);
}

function detectInstallmentPattern(description: string): { current: number; total: number } | null {
  const match = description.match(/(\d+)\s*(?:\/|de)\s*(\d+)/i);
  if (match) {
    return { current: parseInt(match[1]), total: parseInt(match[2]) };
  }
  return null;
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

export function detectRecurringFromTransactions(transactions: Transaction[]): RecurringResult[] {
  const results: RecurringResult[] = [];
  const grouped = new Map<string, Transaction[]>();

  // Group by normalized merchant
  for (const tx of transactions) {
    if (tx.type === 'credit') continue; // Skip income
    const key = normalizeMerchant(tx.description, tx.merchant);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(tx);
  }

  for (const [merchantKey, txs] of grouped) {
    if (txs.length < 2) continue;

    // Sort by date ascending
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));

    // Check for installment pattern in any description
    const installment = detectInstallmentPattern(sorted[sorted.length - 1].description);
    if (installment) {
      const latest = sorted[sorted.length - 1];
      results.push({
        merchant: latest.merchant || latest.description,
        amount: latest.amount,
        frequency: 'monthly',
        type: 'installment',
        installments_remaining: installment.total - installment.current,
        next_expected_date: installment.current < installment.total
          ? addMonths(latest.date, 1)
          : latest.date,
        occurrences: sorted.length,
        transaction_pattern: `${installment.current}/${installment.total}`,
      });
      continue;
    }

    // Check for recurring pattern: monthly frequency + similar amounts
    const intervals: number[] = [];
    let amountConsistent = true;
    let amountsExact = true;

    for (let i = 1; i < sorted.length; i++) {
      intervals.push(daysBetween(sorted[i].date, sorted[i - 1].date));
      if (!isAmountSimilar(sorted[i].amount, sorted[0].amount)) {
        amountConsistent = false;
      }
      if (Math.abs(sorted[i].amount - sorted[0].amount) > 0.01) {
        amountsExact = false;
      }
    }

    if (!amountConsistent) continue;

    // Check if intervals are roughly monthly (25-35 days)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const isMonthly = avgInterval >= 25 && avgInterval <= 35;

    if (isMonthly && sorted.length >= 2) {
      const latest = sorted[sorted.length - 1];

      // Determine type: installment vs subscription
      // - Amounts with slight variation (price adjustments) → subscription
      // - Exact amounts + few occurrences (≤4) + short span → likely installment
      // - 5+ occurrences or spanning 5+ months → subscription (long-running)
      const spanMonths = daysBetween(sorted[0].date, sorted[sorted.length - 1].date) / 30;
      const isLongRunning = spanMonths >= 5;
      const hasAmountVariation = !amountsExact;

      const type: 'subscription' | 'installment' =
        hasAmountVariation || sorted.length >= 5 || isLongRunning
          ? 'subscription'
          : 'installment';

      results.push({
        merchant: latest.merchant || latest.description,
        amount: latest.amount,
        frequency: 'monthly',
        type,
        installments_remaining: type === 'installment' ? Math.max(0, 12 - sorted.length) : undefined,
        next_expected_date: addMonths(latest.date, 1),
        occurrences: sorted.length,
        transaction_pattern: merchantKey,
      });
    }
  }

  return results;
}

export async function detectAndSaveRecurring(userId: string): Promise<RecurringResult[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Fetch user's transactions from last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, description, amount, merchant, date, type')
    .eq('user_id', userId)
    .gte('date', sixMonthsAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (!transactions?.length) return [];

  const results = detectRecurringFromTransactions(transactions);

  // Upsert results into recurring_transactions
  for (const result of results) {
    const { error } = await supabase
      .from('recurring_transactions')
      .upsert(
        {
          user_id: userId,
          transaction_pattern: result.transaction_pattern,
          merchant: result.merchant,
          amount: result.amount,
          frequency: result.frequency,
          type: result.type,
          installments_remaining: result.installments_remaining || null,
          next_expected_date: result.next_expected_date,
          status: 'active',
        },
        { onConflict: 'user_id,transaction_pattern', ignoreDuplicates: false },
      );

    if (error) {
      console.error('[recurring-detector] upsert error:', error.message, 'merchant:', result.merchant);
    }
  }

  return results;
}

export { normalizeMerchant, isAmountSimilar, detectInstallmentPattern };
