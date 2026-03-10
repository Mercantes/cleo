export interface ProjectionPoint {
  month: string;
  balance: number;
}

export interface ProjectionScenario {
  label: 'optimistic' | 'realistic' | 'pessimistic';
  monthlyData: ProjectionPoint[];
  finalBalance: number;
  monthlySavings: number;
}

export interface ProjectionResult {
  scenarios: ProjectionScenario[];
  currentBalance: number;
  savingsRate: number;
  avgIncome: number;
  avgExpenses: number;
  hasEnoughData: boolean;
}

interface TransactionSummary {
  income: number;
  expenses: number;
  month: string;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`;
}

export function summarizeByMonth(
  transactions: { date: string; type: string; amount: number }[],
): TransactionSummary[] {
  const byMonth = new Map<string, { income: number; expenses: number }>();

  for (const tx of transactions) {
    const key = tx.date.slice(0, 7); // YYYY-MM
    const entry = byMonth.get(key) || { income: 0, expenses: 0 };
    if (tx.type === 'credit') {
      entry.income += Math.abs(tx.amount);
    } else {
      entry.expenses += Math.abs(tx.amount);
    }
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));
}

export function calculateProjections(
  transactions: { date: string; type: string; amount: number }[],
  currentBalance: number,
  horizonMonths: number = 12,
): ProjectionResult {
  const monthlySummaries = summarizeByMonth(transactions);

  if (monthlySummaries.length < 2) {
    return {
      scenarios: [],
      currentBalance,
      savingsRate: 0,
      avgIncome: 0,
      avgExpenses: 0,
      hasEnoughData: false,
    };
  }

  const totalIncome = monthlySummaries.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlySummaries.reduce((sum, m) => sum + m.expenses, 0);
  const months = monthlySummaries.length;

  const avgIncome = totalIncome / months;
  const avgExpenses = totalExpenses / months;
  const monthlySavings = avgIncome - avgExpenses;
  const savingsRate = avgIncome > 0 ? monthlySavings / avgIncome : 0;

  const adjustments = {
    optimistic: 0.10,
    realistic: 0,
    pessimistic: -0.10,
  } as const;

  const scenarios: ProjectionScenario[] = (['optimistic', 'realistic', 'pessimistic'] as const).map(
    (label) => {
      const adjustedSavingsRate = Math.min(Math.max(savingsRate + adjustments[label], -1), 1);
      const scenarioMonthlySavings = avgIncome * adjustedSavingsRate;
      let balance = currentBalance;
      const monthlyData: ProjectionPoint[] = [];

      const now = new Date();
      for (let i = 1; i <= horizonMonths; i++) {
        const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        balance += scenarioMonthlySavings;
        monthlyData.push({
          month: getMonthLabel(futureDate),
          balance: Math.round(balance * 100) / 100,
        });
      }

      return {
        label,
        monthlyData,
        finalBalance: Math.round(balance * 100) / 100,
        monthlySavings: Math.round(scenarioMonthlySavings * 100) / 100,
      };
    },
  );

  return {
    scenarios,
    currentBalance,
    savingsRate: Math.round(savingsRate * 10000) / 10000,
    avgIncome: Math.round(avgIncome * 100) / 100,
    avgExpenses: Math.round(avgExpenses * 100) / 100,
    hasEnoughData: true,
  };
}
