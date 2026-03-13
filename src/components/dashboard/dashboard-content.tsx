'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertTriangle, Landmark, RefreshCw } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/components/ui/toast';
import dynamic from 'next/dynamic';
import { MonthSelector } from './month-selector';
import { SummaryCards } from './summary-cards';
import { SubscriptionsCard } from './subscriptions-card';
import { GoalProgressCard } from './goal-progress-card';
import { ChallengesCard } from './challenges-card';
import { SpendingForecast } from './spending-forecast';
import { InsightsBar } from './insights-bar';
import { FinancialHealthCard } from './financial-health-card';

const ExpenseChart = dynamic(() => import('./expense-chart').then((m) => m.ExpenseChart), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded-lg border bg-muted" />,
});

const CategoryChart = dynamic(() => import('./category-chart').then((m) => m.CategoryChart), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded-lg border bg-muted" />,
});

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
  categoryId: string | null;
  percentage: number;
  color: string;
}

interface TrendMonth {
  month: string;
  label: string;
  income: number;
  expenses: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function DashboardContent() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [trends, setTrends] = useState<TrendMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async (m: string, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(false);
    try {
      const [summaryRes, categoriesRes, trendsRes] = await Promise.all([
        fetch(`/api/dashboard/summary?month=${m}`),
        fetch(`/api/dashboard/categories?month=${m}`),
        fetch('/api/dashboard/trends'),
      ]);

      if (!summaryRes.ok || !categoriesRes.ok || !trendsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [summaryData, categoriesData, trendsData] = await Promise.all([
        summaryRes.json(),
        categoriesRes.json(),
        trendsRes.json(),
      ]);

      setSummary(summaryData);
      setCategories(categoriesData.categories || []);
      setTrends(trendsData.months || []);
    } catch {
      setError(true);
    } finally {
      if (refresh) toast('Dados atualizados');
      setIsLoading(false);
      setIsRefreshing(false);
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

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Erro ao carregar dados"
        description="Não foi possível carregar o dashboard. Verifique sua conexão e tente novamente."
        action={{ label: 'Tentar novamente', onClick: () => fetchData(month) }}
      />
    );
  }

  const hasData = summary && (summary.income > 0 || summary.expenses > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            <p className="text-sm text-muted-foreground">
              Aqui está o resumo das suas finanças
            </p>
          </div>
          <button
            onClick={() => fetchData(month, true)}
            disabled={isRefreshing}
            aria-label="Atualizar dados"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <MonthSelector month={month} onChange={handleMonthChange} />
      </div>

      {summary && <SummaryCards data={summary} />}

      <InsightsBar />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Landmark className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Conecte seu banco para começar</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Importe suas transações automaticamente via Open Finance e veja seus gráficos e
              análises aqui.
            </p>
          </div>
          <Link href="/settings" className={buttonVariants()}>
            Conectar banco
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ExpenseChart data={trends} />
            <CategoryChart data={categories} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <GoalProgressCard />
            <ChallengesCard />
            <FinancialHealthCard />
          </div>

          <SpendingForecast />

          <SubscriptionsCard />
        </>
      )}
    </div>
  );
}
