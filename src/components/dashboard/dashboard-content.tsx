'use client';

import { useEffect, useState, useCallback } from 'react';
import { MonthSelector } from './month-selector';
import { SummaryCards } from './summary-cards';
import { ExpenseChart } from './expense-chart';
import { CategoryChart } from './category-chart';
import { SubscriptionsCard } from './subscriptions-card';

interface SummaryData {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  percentChange: number;
  month: string;
}

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface TrendMonth {
  month: string;
  label: string;
  income: number;
  expenses: number;
}

export function DashboardContent() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [trends, setTrends] = useState<TrendMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (m: string) => {
    setIsLoading(true);
    try {
      const [summaryRes, categoriesRes, trendsRes] = await Promise.all([
        fetch(`/api/dashboard/summary?month=${m}`),
        fetch(`/api/dashboard/categories?month=${m}`),
        fetch('/api/dashboard/trends'),
      ]);

      const [summaryData, categoriesData, trendsData] = await Promise.all([
        summaryRes.json(),
        categoriesRes.json(),
        trendsRes.json(),
      ]);

      setSummary(summaryData);
      setCategories(categoriesData.categories || []);
      setTrends(trendsData.months || []);
    } catch {
      // Keep empty state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(month);
  }, [month, fetchData]);

  function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-lg border bg-muted" />
        <div className="h-[250px] animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <MonthSelector month={month} onChange={handleMonthChange} />
      </div>

      {summary && <SummaryCards data={summary} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <ExpenseChart data={trends} />
        <CategoryChart data={categories} />
      </div>

      <SubscriptionsCard />
    </div>
  );
}
