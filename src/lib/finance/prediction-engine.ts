import { createAdminClient } from '@/lib/supabase/admin';

const EWMA_ALPHA = 0.3;
const SEASONAL_BLEND = 0.7; // 70% EWMA, 30% same-month-last-year

export interface MonthlyPrediction {
  period: string;
  predicted_expenses: number;
  predicted_income: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface CategoryPrediction {
  category_name: string;
  category_id: string;
  predicted_amount: number;
  trend: 'rising' | 'stable' | 'falling';
  confidence: 'high' | 'medium' | 'low';
}

export interface PredictionResult {
  next_month: MonthlyPrediction;
  category_predictions: CategoryPrediction[];
  savings_opportunity: number;
  overspend_risk: boolean;
  has_enough_data: boolean;
}

interface MonthlySummary {
  period: string;
  category_id: string | null;
  income: number;
  expenses: number;
  transaction_count: number;
}

/**
 * Compute EWMA (Exponentially Weighted Moving Average).
 * More recent values have higher weight.
 */
export function computeEWMA(values: number[], alpha: number = EWMA_ALPHA): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  let ewma = values[0];
  for (let i = 1; i < values.length; i++) {
    ewma = alpha * values[i] + (1 - alpha) * ewma;
  }
  return Math.round(ewma * 100) / 100;
}

/**
 * Detect if there's a seasonal pattern by checking same month last year.
 */
function getSeasonalValue(
  summaries: MonthlySummary[],
  targetMonth: number,
  field: 'income' | 'expenses',
): number | null {
  const targetMonthStr = String(targetMonth + 1).padStart(2, '0');
  const sameMonthEntries = summaries.filter(
    (s) => s.period.endsWith(`-${targetMonthStr}`) && s.category_id === null,
  );
  if (sameMonthEntries.length === 0) return null;
  // Average of same-month values from previous years
  const avg =
    sameMonthEntries.reduce((sum, s) => sum + Number(s[field]), 0) / sameMonthEntries.length;
  return avg;
}

/**
 * Predict next month's spending and income using EWMA + seasonal adjustment.
 */
export async function predictNextMonth(userId: string): Promise<PredictionResult> {
  const supabase = createAdminClient();

  const { data: summaries } = await supabase
    .from('monthly_spending_summaries')
    .select('period, category_id, income, expenses, transaction_count')
    .eq('user_id', userId)
    .order('period', { ascending: true });

  if (!summaries || summaries.length < 2) {
    return {
      next_month: {
        period: getNextPeriod(),
        predicted_expenses: 0,
        predicted_income: 0,
        confidence: 'low',
      },
      category_predictions: [],
      savings_opportunity: 0,
      overspend_risk: false,
      has_enough_data: false,
    };
  }

  const typedSummaries = summaries as MonthlySummary[];

  // Overall summaries (category_id IS NULL)
  const overallSummaries = typedSummaries
    .filter((s) => s.category_id === null)
    .sort((a, b) => a.period.localeCompare(b.period));

  if (overallSummaries.length < 2) {
    return {
      next_month: {
        period: getNextPeriod(),
        predicted_expenses: 0,
        predicted_income: 0,
        confidence: 'low',
      },
      category_predictions: [],
      savings_opportunity: 0,
      overspend_risk: false,
      has_enough_data: false,
    };
  }

  const expenseValues = overallSummaries.map((s) => Number(s.expenses));
  const incomeValues = overallSummaries.map((s) => Number(s.income));

  // EWMA predictions
  let predictedExpenses = computeEWMA(expenseValues);
  let predictedIncome = computeEWMA(incomeValues);

  // Seasonal adjustment
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const targetMonth = nextMonth.getMonth();

  const seasonalExpenses = getSeasonalValue(typedSummaries, targetMonth, 'expenses');
  const seasonalIncome = getSeasonalValue(typedSummaries, targetMonth, 'income');

  if (seasonalExpenses !== null) {
    predictedExpenses =
      SEASONAL_BLEND * predictedExpenses + (1 - SEASONAL_BLEND) * seasonalExpenses;
  }
  if (seasonalIncome !== null) {
    predictedIncome = SEASONAL_BLEND * predictedIncome + (1 - SEASONAL_BLEND) * seasonalIncome;
  }

  predictedExpenses = Math.round(predictedExpenses * 100) / 100;
  predictedIncome = Math.round(predictedIncome * 100) / 100;

  // Confidence based on data points
  const confidence: 'high' | 'medium' | 'low' =
    overallSummaries.length >= 6 ? 'high' : overallSummaries.length >= 3 ? 'medium' : 'low';

  // Category predictions
  const categoryPredictions = predictCategories(typedSummaries);

  // Savings opportunity: if predicted expenses > average, the delta is opportunity
  const avgExpenses = expenseValues.reduce((s, v) => s + v, 0) / expenseValues.length;
  const savingsOpportunity = Math.max(0, Math.round((predictedExpenses - avgExpenses) * 100) / 100);

  // Overspend risk: if predicted expenses > predicted income
  const overspendRisk = predictedExpenses > predictedIncome * 0.95;

  return {
    next_month: {
      period: getNextPeriod(),
      predicted_expenses: predictedExpenses,
      predicted_income: predictedIncome,
      confidence,
    },
    category_predictions: categoryPredictions,
    savings_opportunity: savingsOpportunity,
    overspend_risk: overspendRisk,
    has_enough_data: true,
  };
}

function predictCategories(summaries: MonthlySummary[]): CategoryPrediction[] {
  // Group by category
  const byCat = new Map<string, { id: string; values: number[] }>();

  for (const s of summaries) {
    if (!s.category_id) continue;
    const existing = byCat.get(s.category_id) || { id: s.category_id, values: [] };
    existing.values.push(Number(s.expenses));
    byCat.set(s.category_id, existing);
  }

  // Fetch category names from the summaries context isn't available,
  // so we'll use the category_id as key and resolve names later
  const predictions: CategoryPrediction[] = [];

  for (const [catId, data] of byCat) {
    if (data.values.length < 2) continue;

    const predicted = computeEWMA(data.values);
    const recent = data.values.slice(-3);
    const older = data.values.slice(0, -3);

    let trend: 'rising' | 'stable' | 'falling' = 'stable';
    if (recent.length >= 2 && older.length >= 1) {
      const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
      const olderAvg = older.reduce((s, v) => s + v, 0) / older.length;
      const change = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
      if (change > 0.15) trend = 'rising';
      else if (change < -0.15) trend = 'falling';
    }

    const confidence: 'high' | 'medium' | 'low' =
      data.values.length >= 6 ? 'high' : data.values.length >= 3 ? 'medium' : 'low';

    predictions.push({
      category_name: catId, // Will be resolved by API
      category_id: catId,
      predicted_amount: predicted,
      trend,
      confidence,
    });
  }

  return predictions.sort((a, b) => b.predicted_amount - a.predicted_amount).slice(0, 10);
}

function getNextPeriod(): string {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Build monthly spending summaries from transaction history.
 * Called by the monthly cron job.
 */
export async function buildMonthlySummaries(userId: string): Promise<number> {
  const supabase = createAdminClient();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, date, category_id')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (!transactions || transactions.length === 0) return 0;

  // Aggregate by period + category
  const summaryMap = new Map<
    string,
    { income: number; expenses: number; count: number; category_id: string | null }
  >();

  for (const tx of transactions) {
    const period = (tx.date as string).slice(0, 7);
    const catId = (tx.category_id as string) || null;

    // Per-category summary
    if (catId) {
      const catKey = `${period}:${catId}`;
      const entry = summaryMap.get(catKey) || {
        income: 0,
        expenses: 0,
        count: 0,
        category_id: catId,
      };
      if (tx.type === 'credit') entry.income += Math.abs(Number(tx.amount));
      else entry.expenses += Math.abs(Number(tx.amount));
      entry.count++;
      summaryMap.set(catKey, entry);
    }

    // Overall summary (null category)
    const overallKey = `${period}:overall`;
    const overall = summaryMap.get(overallKey) || {
      income: 0,
      expenses: 0,
      count: 0,
      category_id: null,
    };
    if (tx.type === 'credit') overall.income += Math.abs(Number(tx.amount));
    else overall.expenses += Math.abs(Number(tx.amount));
    overall.count++;
    summaryMap.set(overallKey, overall);
  }

  // Build upsert rows
  const rows: Array<{
    user_id: string;
    period: string;
    category_id: string | null;
    income: number;
    expenses: number;
    transaction_count: number;
  }> = [];

  for (const [key, data] of summaryMap) {
    const period = key.split(':')[0];
    rows.push({
      user_id: userId,
      period,
      category_id: data.category_id,
      income: Math.round(data.income * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
      transaction_count: data.count,
    });
  }

  // Upsert in batches (Supabase has limits)
  const BATCH_SIZE = 200;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('monthly_spending_summaries').upsert(batch, {
      onConflict: 'user_id,period,category_id',
    });
    if (error) {
      console.error('[prediction-engine] Upsert error:', error.message);
    } else {
      upserted += batch.length;
    }
  }

  return upserted;
}
