// Shared types for dashboard components and API responses

export interface SummaryData {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  percentChange: number;
  month: string;
}

export interface CategoryData {
  name: string;
  amount: number;
  categoryId: string | null;
  percentage: number;
  color: string;
  change?: number | null;
}

export interface TrendMonth {
  month: string;
  label: string;
  income: number;
  expenses: number;
}

export interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  monthlyLimit: number;
  spent: number;
  percentage: number;
  status: 'over' | 'warning' | 'ok';
}

export interface RecurringItem {
  merchant: string;
  amount: number;
  frequency: string;
  type: string;
  next_expected_date: string;
  installments_remaining?: number;
}

export interface GoalProgress {
  currentSavings: number;
  target: number;
  percentage: number;
  income: number;
  expenses: number;
}

export interface Gamification {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  bestStreak: number;
  totalChallengesCompleted: number;
}
