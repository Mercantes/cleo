import { createAdminClient } from '@/lib/supabase/admin';

const Z_SCORE_THRESHOLD = 2.0;
const MIN_TRANSACTIONS_FOR_DETECTION = 5;

export interface SpendingStat {
  stat_type: 'merchant' | 'category' | 'overall';
  stat_key: string;
  mean_amount: number;
  stddev_amount: number;
  transaction_count: number;
}

export interface Anomaly {
  transaction_id: string;
  description: string;
  merchant: string | null;
  amount: number;
  date: string;
  stat_type: 'merchant' | 'category' | 'overall';
  stat_key: string;
  z_score: number;
  expected_mean: number;
  expected_stddev: number;
}

/**
 * Update spending stats using Welford's online algorithm.
 * Computes running mean and standard deviation without storing all values.
 */
export function welfordUpdate(
  currentMean: number,
  currentStddev: number,
  currentCount: number,
  newValue: number,
): { mean: number; stddev: number; count: number } {
  const n = currentCount + 1;
  const delta = newValue - currentMean;
  const newMean = currentMean + delta / n;
  const delta2 = newValue - newMean;

  // M2 = variance * (n-1), reconstruct from stddev
  const oldM2 = currentCount > 1 ? currentStddev * currentStddev * (currentCount - 1) : 0;
  const newM2 = oldM2 + delta * delta2;

  const newStddev = n > 1 ? Math.sqrt(newM2 / (n - 1)) : 0;

  return {
    mean: Math.round(newMean * 100) / 100,
    stddev: Math.round(newStddev * 100) / 100,
    count: n,
  };
}

/**
 * Batch-update spending stats for a user from their transaction history.
 * Called by the daily cron job.
 */
export async function updateSpendingStats(userId: string): Promise<number> {
  const supabase = createAdminClient();

  // Fetch all debit transactions for aggregation
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, amount, type, merchant, description, category_id, categories(name)')
    .eq('user_id', userId)
    .eq('type', 'debit')
    .order('date', { ascending: true });

  if (!transactions || transactions.length === 0) return 0;

  // Aggregate stats by merchant and category
  const merchantStats = new Map<string, { mean: number; stddev: number; count: number }>();
  const categoryStats = new Map<string, { mean: number; stddev: number; count: number }>();
  let overallStats = { mean: 0, stddev: 0, count: 0 };

  for (const tx of transactions) {
    const amount = Math.abs(Number(tx.amount));

    // Overall stats
    overallStats = welfordUpdate(
      overallStats.mean,
      overallStats.stddev,
      overallStats.count,
      amount,
    );

    // Merchant stats
    const merchantKey = (tx.merchant || tx.description || '').toLowerCase().trim();
    if (merchantKey) {
      const current = merchantStats.get(merchantKey) || { mean: 0, stddev: 0, count: 0 };
      merchantStats.set(
        merchantKey,
        welfordUpdate(current.mean, current.stddev, current.count, amount),
      );
    }

    // Category stats
    const catObj = tx.categories as unknown as { name: string } | null;
    const catName = catObj?.name;
    if (catName) {
      const current = categoryStats.get(catName) || { mean: 0, stddev: 0, count: 0 };
      categoryStats.set(
        catName,
        welfordUpdate(current.mean, current.stddev, current.count, amount),
      );
    }
  }

  // Upsert all stats
  const rows: Array<{
    user_id: string;
    stat_type: string;
    stat_key: string;
    mean_amount: number;
    stddev_amount: number;
    transaction_count: number;
    last_updated: string;
  }> = [];

  const now = new Date().toISOString();

  rows.push({
    user_id: userId,
    stat_type: 'overall',
    stat_key: 'all',
    mean_amount: overallStats.mean,
    stddev_amount: overallStats.stddev,
    transaction_count: overallStats.count,
    last_updated: now,
  });

  for (const [key, stat] of merchantStats) {
    rows.push({
      user_id: userId,
      stat_type: 'merchant',
      stat_key: key,
      mean_amount: stat.mean,
      stddev_amount: stat.stddev,
      transaction_count: stat.count,
      last_updated: now,
    });
  }

  for (const [key, stat] of categoryStats) {
    rows.push({
      user_id: userId,
      stat_type: 'category',
      stat_key: key,
      mean_amount: stat.mean,
      stddev_amount: stat.stddev,
      transaction_count: stat.count,
      last_updated: now,
    });
  }

  // Batch upsert (Supabase supports onConflict)
  const { error } = await supabase.from('user_spending_stats').upsert(rows, {
    onConflict: 'user_id,stat_type,stat_key',
  });

  if (error) {
    console.error('[anomaly-detector] Failed to upsert stats:', error.message);
    return 0;
  }

  return rows.length;
}

/**
 * Detect anomalies in recent transactions for a user.
 * Compares each transaction against stored spending stats using z-score.
 */
export async function detectAnomalies(userId: string, daysBack: number = 7): Promise<Anomaly[]> {
  const supabase = createAdminClient();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - daysBack);
  const sinceDateStr = sinceDate.toISOString().split('T')[0];

  const [txResult, statsResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, amount, type, merchant, description, date, category_id, categories(name)')
      .eq('user_id', userId)
      .eq('type', 'debit')
      .gte('date', sinceDateStr)
      .order('date', { ascending: false }),
    supabase.from('user_spending_stats').select('*').eq('user_id', userId),
  ]);

  const transactions = txResult.data || [];
  const stats = statsResult.data || [];

  if (transactions.length === 0 || stats.length === 0) return [];

  // Index stats for fast lookup
  const statsMap = new Map<string, SpendingStat>();
  for (const s of stats) {
    statsMap.set(`${s.stat_type}:${s.stat_key}`, s as SpendingStat);
  }

  const anomalies: Anomaly[] = [];

  for (const tx of transactions) {
    const amount = Math.abs(Number(tx.amount));
    const merchantKey = (tx.merchant || tx.description || '').toLowerCase().trim();
    const catObj = tx.categories as unknown as { name: string } | null;
    const catName = catObj?.name;

    // Check merchant-level anomaly first, then category, then overall
    const checks: Array<{ type: 'merchant' | 'category' | 'overall'; key: string }> = [];
    if (merchantKey) checks.push({ type: 'merchant', key: merchantKey });
    if (catName) checks.push({ type: 'category', key: catName });
    checks.push({ type: 'overall', key: 'all' });

    for (const check of checks) {
      const stat = statsMap.get(`${check.type}:${check.key}`);
      if (
        !stat ||
        stat.transaction_count < MIN_TRANSACTIONS_FOR_DETECTION ||
        stat.stddev_amount === 0
      ) {
        continue;
      }

      const zScore = Math.abs(amount - stat.mean_amount) / stat.stddev_amount;

      if (zScore >= Z_SCORE_THRESHOLD) {
        anomalies.push({
          transaction_id: tx.id as string,
          description: (tx.description || '') as string,
          merchant: tx.merchant as string | null,
          amount,
          date: tx.date as string,
          stat_type: check.type,
          stat_key: check.key,
          z_score: Math.round(zScore * 100) / 100,
          expected_mean: stat.mean_amount,
          expected_stddev: stat.stddev_amount,
        });
        break; // One anomaly per transaction (most specific level)
      }
    }
  }

  // Sort by z_score descending (most anomalous first)
  anomalies.sort((a, b) => b.z_score - a.z_score);
  return anomalies;
}
