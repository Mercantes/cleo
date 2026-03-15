import { createClient } from '@supabase/supabase-js';

export interface RecurringResult {
  merchant: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  type: 'subscription' | 'installment';
  status: 'active' | 'inactive';
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
  'nubank vida', 'porto seguro', 'sulamerica',
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
    .replace(/\*+/g, ' ')
    .replace(/\b(br|brasil|sao paulo|sp|rj|rio)\b/gi, '') // Remove location suffixes
    .replace(/\s+/g, ' ')
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

function hasMultiplePerMonth(transactions: Transaction[]): boolean {
  const monthCounts = new Map<string, number>();
  for (const tx of transactions) {
    const monthKey = tx.date.slice(0, 7); // YYYY-MM
    monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
  }
  const counts = [...monthCounts.values()];
  const avgPerMonth = counts.reduce((a, b) => a + b, 0) / counts.length;
  return avgPerMonth > 1.5; // More than 1.5 transactions per month on average = not subscription
}

export function detectRecurringFromTransactions(transactions: Transaction[]): RecurringResult[] {
  const results: RecurringResult[] = [];
  const grouped = new Map<string, Transaction[]>();

  // STEP 1: Filter credits and group by normalized merchant
  for (const tx of transactions) {
    if (tx.type === 'credit') continue;
    const key = normalizeMerchant(tx.description, tx.merchant);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(tx);
  }

  for (const [merchantKey, txs] of grouped) {
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];

    // STEP 1: Installment pattern X/Y has absolute precedence
    const installment = detectInstallmentPattern(sorted[sorted.length - 1].description);
    if (installment) {
      results.push({
        merchant: latest.merchant || latest.description,
        amount: latest.amount,
        frequency: 'monthly',
        type: 'installment',
        status: installment.current < installment.total ? 'active' : 'inactive',
        confidence: 'high',
        installments_remaining: installment.total - installment.current,
        next_expected_date: installment.current < installment.total
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
        const daysSinceLast = daysBetween(latest.date, new Date().toISOString().split('T')[0]);
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

    // STEP 3: Regularity check — irregular intervals = not subscription
    const isRegular = intervalStdDev <= 10;
    if (!isRegular) continue;

    // Reject if multiple transactions per month (avulse purchases, not subscription)
    if (hasMultiplePerMonth(sorted)) continue;

    // STEP 4: Differentiate installment vs subscription
    const isKnown = isKnownSubscription(merchantKey);
    const daysSinceLast = daysBetween(latest.date, new Date().toISOString().split('T')[0]);
    const isActive = daysSinceLast <= 45;

    // Known subscriptions with regular interval → subscription (high confidence)
    if (isKnown) {
      results.push({
        merchant: latest.merchant || latest.description,
        amount: latest.amount,
        frequency: 'monthly',
        type: 'subscription',
        status: isActive ? 'active' : 'inactive',
        confidence: 'high',
        next_expected_date: addMonths(latest.date, 1),
        occurrences: sorted.length,
        transaction_pattern: merchantKey,
      });
      continue;
    }

    // Amount-based classification for unknown merchants
    if (amountCV <= 0.03) {
      // Near-identical amounts: could be installment or subscription
      // Installment: ≤12 occurrences, span < 13 months, and no recent charge (finished)
      const spanMonths = daysBetween(sorted[0].date, sorted[sorted.length - 1].date) / 30;

      if (sorted.length <= 12 && spanMonths < 13 && !isActive) {
        // Finished installment plan
        results.push({
          merchant: latest.merchant || latest.description,
          amount: latest.amount,
          frequency: 'monthly',
          type: 'installment',
          status: 'inactive',
          confidence: 'medium',
          installments_remaining: 0,
          next_expected_date: latest.date,
          occurrences: sorted.length,
          transaction_pattern: merchantKey,
        });
      } else if (sorted.length <= 4 && spanMonths < 5) {
        // Few occurrences, short span, still active → likely installment in progress
        results.push({
          merchant: latest.merchant || latest.description,
          amount: latest.amount,
          frequency: 'monthly',
          type: 'installment',
          status: isActive ? 'active' : 'inactive',
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
          status: isActive ? 'active' : 'inactive',
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
        status: isActive ? 'active' : 'inactive',
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
        status: isActive ? 'active' : 'inactive',
        confidence: 'low',
        next_expected_date: addMonths(latest.date, 1),
        occurrences: sorted.length,
        transaction_pattern: merchantKey,
      });
    }
    // CV > 30% or irregular + high variation → skip (not subscription or installment)
  }

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
          status: result.status,
        },
        { onConflict: 'user_id,transaction_pattern', ignoreDuplicates: false },
      );

    if (error) {
      console.error('[recurring-detector] upsert error:', error.message, 'merchant:', result.merchant);
    }
  }

  return results;
}

export { normalizeMerchant, isAmountSimilar, detectInstallmentPattern, coefficientOfVariation, standardDeviation, isKnownSubscription, hasMultiplePerMonth, KNOWN_SUBSCRIPTIONS };
