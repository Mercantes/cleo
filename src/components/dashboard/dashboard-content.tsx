'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertTriangle, Landmark, RefreshCw } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/components/ui/toast';
import dynamic from 'next/dynamic';
import { MonthSelector } from './month-selector';
import { SubscriptionsCard } from './subscriptions-card';
const GoalProgressCard = dynamic(() => import('./goal-progress-card').then((m) => m.GoalProgressCard), {
  ssr: false,
  loading: () => <div className="h-[180px] animate-pulse rounded-lg border bg-muted" />,
});
import { ChallengesCard } from './challenges-card';
import { SpendingForecast } from './spending-forecast';
import { FinancialHealthCard } from './financial-health-card';
import { AccountsCard } from './accounts-card';
import { RecentTransactionsCard } from './recent-transactions-card';
import { SetupChecklist } from './setup-checklist';
import { CategoryBudgetsCard } from './category-budgets-card';
const StreakCard = dynamic(() => import('./streak-card').then((m) => m.StreakCard), {
  ssr: false,
  loading: () => <div className="h-[160px] animate-pulse rounded-lg border bg-muted" />,
});
import { EmergencyFundCard } from './emergency-fund-card';
import { PartialResultCard } from './partial-result-card';
import { CategoriesTableCard } from './categories-table-card';
import { UpcomingExpensesCard } from './upcoming-expenses-card';
import { AnimateIn } from '@/components/ui/animate-in';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import type { SummaryData, CategoryData, TrendMonth } from '@/types/dashboard';

const SpendingPaceCard = dynamic(() => import('./spending-pace-card').then((m) => m.SpendingPaceCard), {
  ssr: false,
  loading: () => <div className="h-[380px] animate-pulse rounded-lg border bg-muted" />,
});

const NetWorthCard = dynamic(() => import('./net-worth-card').then((m) => m.NetWorthCard), {
  ssr: false,
  loading: () => <div className="h-[380px] animate-pulse rounded-lg border bg-muted" />,
});

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getQuickInsight(summary: SummaryData | null): string | null {
  if (!summary || (summary.income === 0 && summary.expenses === 0)) return null;

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);

  if (summary.savingsRate >= 20) {
    return `Economia de ${Math.round(summary.savingsRate)}% este mês — excelente!`;
  }

  if (summary.expenses > 0 && summary.income > 0) {
    const spendingPace = (summary.expenses / dayOfMonth) * daysInMonth;
    if (spendingPace > summary.income * 1.1) {
      return `No ritmo atual, seus gastos podem ultrapassar a receita este mês.`;
    }
  }

  if (monthProgress > 50 && summary.savingsRate >= 10) {
    return `Já passou da metade do mês com ${Math.round(summary.savingsRate)}% de economia.`;
  }

  return null;
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

  useEffect(() => {
    function handleRefresh() {
      fetchData(month, true);
    }
    window.addEventListener('cleo:refresh-dashboard', handleRefresh);
    return () => window.removeEventListener('cleo:refresh-dashboard', handleRefresh);
  }, [month, fetchData]);

  const { indicatorRef } = usePullToRefresh({
    onRefresh: () => fetchData(month, true),
  });

  function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-1.5 h-4 w-56 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-[380px] animate-pulse rounded-lg border bg-muted" />
          <div className="h-[380px] animate-pulse rounded-lg border bg-muted" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-[250px] animate-pulse rounded-lg border bg-muted" />
          <div className="h-[250px] animate-pulse rounded-lg border bg-muted" />
        </div>
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
      {/* Pull-to-refresh indicator (mobile) */}
      <div
        ref={indicatorRef}
        className="pointer-events-none flex flex-col items-center gap-1 opacity-0 transition-opacity md:hidden"
        style={{ transform: 'translateY(0)' }}
      >
        <RefreshCw className="h-5 w-5 text-primary" />
        <span className="text-[10px] text-muted-foreground">Puxe para atualizar</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            <button
              onClick={() => fetchData(month, true)}
              disabled={isRefreshing}
              aria-label="Atualizar dados"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {getQuickInsight(summary) || 'Aqui está o resumo das suas finanças'}
          </p>
        </div>
        <MonthSelector month={month} onChange={handleMonthChange} />
      </div>

      <SetupChecklist />

      {/* Insights removidos — Cleo enviará via push */}

      {!hasData ? (
        <AnimateIn delay={100}>
          <div className="flex flex-col items-center justify-center gap-6 rounded-lg border border-dashed py-20 text-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Landmark className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Conecte seu banco para começar</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Importe suas transações automaticamente via Open Finance e veja seus gráficos e
                análises aqui.
              </p>
            </div>
            <Link href="/settings?tab=banks" className={buttonVariants({ size: 'lg' })}>
              <Landmark className="mr-2 h-4 w-4" />
              Conectar banco
            </Link>
          </div>
        </AnimateIn>
      ) : (
        <>
          {/* Row 1: Spending Pace + Net Worth */}
          <AnimateIn delay={100}>
            <div className="grid gap-4 lg:grid-cols-2">
              <ErrorBoundary>
                {summary && <SpendingPaceCard data={summary} />}
              </ErrorBoundary>
              <ErrorBoundary>
                <NetWorthCard />
              </ErrorBoundary>
            </div>
          </AnimateIn>

          {/* Row 2: Partial Result + Categories Table */}
          <AnimateIn delay={150}>
            <div className="grid gap-4 lg:grid-cols-2">
              <ErrorBoundary>
                {summary && <PartialResultCard data={summary} />}
              </ErrorBoundary>
              <ErrorBoundary>
                <CategoriesTableCard data={categories} month={month} />
              </ErrorBoundary>
            </div>
          </AnimateIn>

          {/* Row 3: Recent Transactions + Upcoming Expenses */}
          <AnimateIn delay={200}>
            <div className="grid gap-4 lg:grid-cols-2">
              <ErrorBoundary><RecentTransactionsCard /></ErrorBoundary>
              <ErrorBoundary><UpcomingExpensesCard /></ErrorBoundary>
            </div>
          </AnimateIn>

          {/* Row 4: Accounts + Emergency Fund */}
          <AnimateIn delay={225}>
            <div className="grid gap-4 lg:grid-cols-2 [&>:only-child]:col-span-full">
              <ErrorBoundary><AccountsCard /></ErrorBoundary>
              <ErrorBoundary><EmergencyFundCard /></ErrorBoundary>
            </div>
          </AnimateIn>

          {/* Row 4: Goals, Challenges, Health */}
          <AnimateIn delay={250}>
            <div className="grid gap-4 lg:grid-cols-3">
              <ErrorBoundary><GoalProgressCard /></ErrorBoundary>
              <ErrorBoundary><ChallengesCard /></ErrorBoundary>
              <ErrorBoundary><FinancialHealthCard /></ErrorBoundary>
            </div>
          </AnimateIn>

          <AnimateIn delay={275}>
            <ErrorBoundary><StreakCard /></ErrorBoundary>
          </AnimateIn>

          <AnimateIn delay={300}><ErrorBoundary><CategoryBudgetsCard /></ErrorBoundary></AnimateIn>

          <AnimateIn delay={325}><ErrorBoundary><SpendingForecast /></ErrorBoundary></AnimateIn>

          <AnimateIn delay={350}><ErrorBoundary><SubscriptionsCard /></ErrorBoundary></AnimateIn>
        </>
      )}
    </div>
  );
}
