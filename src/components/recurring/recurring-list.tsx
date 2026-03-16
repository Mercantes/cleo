'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Repeat,
  CreditCard,
  Loader2,
  MessageSquare,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface RecurringItem {
  id: string;
  merchant: string;
  amount: number;
  frequency: string;
  type: 'subscription' | 'installment' | 'income';
  user_override: string | null;
  installments_remaining: number | null;
  next_expected_date: string;
  status: string;
}

interface RecurringData {
  subscriptions: RecurringItem[];
  installments: RecurringItem[];
  income: RecurringItem[];
  monthlyTotal: number;
  monthlyIncome: number;
}

type Tab = 'expenses' | 'income';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function RingChart({ paidPercent }: { paidPercent: number }) {
  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const filled = (paidPercent / 100) * circumference;
  const size = (radius + stroke) * 2;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/50"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - filled}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="text-primary transition-all"
      />
    </svg>
  );
}

function formatEndDate(dateStr: string, remaining: number | null) {
  if (!remaining || !dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  // Estimate end date: next_expected_date + remaining months
  const end = new Date(d.getFullYear(), d.getMonth() + remaining, d.getDate());
  return `até ${end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')}`;
}

export function RecurringList() {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const router = useRouter();
  const { data, isLoading, error: fetchError, mutate } = useApi<RecurringData>('/api/recurring');
  const [isDetecting, setIsDetecting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('expenses');

  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const viewDate = useMemo(() => new Date(now.getFullYear(), now.getMonth() + monthOffset, 1), [monthOffset]); // eslint-disable-line react-hooks/exhaustive-deps
  const monthLabel = `${MONTHS[viewDate.getMonth()]} de ${viewDate.getFullYear()}`;

  const subscriptions = data?.subscriptions || [];
  const installments = data?.installments || [];
  const income = data?.income || [];
  const monthlyTotal = data?.monthlyTotal || 0;
  const monthlyIncome = data?.monthlyIncome || 0;
  const hasExpenseData = subscriptions.length > 0 || installments.length > 0;
  const hasIncomeData = income.length > 0;
  const hasAnyData = hasExpenseData || hasIncomeData;

  // Auto-detect recurring transactions when data loads empty
  const autoDetectRan = useRef(false);
  useEffect(() => {
    if (!isLoading && data && !hasAnyData && !autoDetectRan.current && !isDetecting) {
      autoDetectRan.current = true;
      handleDetect();
    }
  }, [isLoading, data, hasAnyData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate summary values
  const installmentsTotal = installments.reduce((s, i) => s + Number(i.amount), 0);
  const subscriptionsTotal = subscriptions.reduce((s, i) => s + Number(i.amount), 0);
  // For the ring chart, we simulate "paid" as 0 (beginning of month) for simplicity
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const paidPercent = monthOffset === 0 ? Math.round((dayOfMonth / daysInMonth) * 100) : monthOffset < 0 ? 100 : 0;

  // Installments remaining total
  const installmentsRemainingTotal = installments.reduce((s, i) => s + Number(i.amount) * (i.installments_remaining || 1), 0);

  async function handleDetect() {
    setIsDetecting(true);
    try {
      const res = await fetch('/api/recurring/detect', { method: 'POST' });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success('Recorrências atualizadas');
    } catch {
      toast.error('Não foi possível detectar recorrências. Tente novamente.');
    } finally {
      setIsDetecting(false);
    }
  }

  const handleToggleType = useCallback(async (item: RecurringItem) => {
    const newType = item.type === 'subscription' ? 'installment' : 'subscription';
    setTogglingId(item.id);

    if (data) {
      const allItems = [...data.subscriptions, ...data.installments, ...data.income];
      const updated = allItems.map(i => i.id === item.id ? { ...i, type: newType as 'subscription' | 'installment' | 'income' } : i);
      mutate({
        subscriptions: updated.filter(i => i.type === 'subscription'),
        installments: updated.filter(i => i.type === 'installment'),
        income: updated.filter(i => i.type === 'income'),
        monthlyTotal: data.monthlyTotal,
        monthlyIncome: data.monthlyIncome,
      }, false);
    }

    try {
      const res = await fetch('/api/recurring', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, type: newType }),
      });
      if (!res.ok) throw new Error();
      toast.success(newType === 'subscription' ? 'Marcado como assinatura' : 'Marcado como parcela');
    } catch {
      await mutate();
      toast.error('Erro ao atualizar classificação');
    } finally {
      setTogglingId(null);
    }
  }, [data, mutate]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setTab('expenses')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'expenses'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <TrendingDown className="h-4 w-4" />
          Despesas
        </button>
        <button
          onClick={() => setTab('income')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'income'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <TrendingUp className="h-4 w-4" />
          Receitas
        </button>
      </div>

      {fetchError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Não foi possível carregar suas recorrências.
        </div>
      )}

      {tab === 'income' ? (
        !hasIncomeData ? (
          <div className="space-y-4">
            {isDetecting ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analisando suas transações...</p>
              </div>
            ) : (
              <>
                <EmptyState
                  icon={TrendingUp}
                  title="Nenhuma receita recorrente detectada"
                  description="Nenhuma receita recorrente foi encontrada nas suas transações."
                />
                <div className="flex justify-center">
                  <Button onClick={handleDetect} disabled={isDetecting}>
                    Detectar novamente
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Income summary card */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Receita recorrente</p>
                  <p className="text-xl font-bold">
                    {fmt(monthlyIncome)}
                    <span className="text-base font-normal text-muted-foreground">/mês</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-6 border-t pt-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Fontes ativas:</span>
                  <span className="font-medium">{income.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Anual estimado:</span>
                  <span className="font-medium">{fmt(monthlyIncome * 12)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDetect}
                  disabled={isDetecting}
                  className="ml-auto"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isDetecting && 'animate-spin')} />
                  {isDetecting ? 'Detectando...' : 'Atualizar'}
                </Button>
              </div>
            </div>

            {/* Income items */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  Receitas Recorrentes
                </h2>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmt(monthlyIncome)}/mês</p>
                  <p className="text-xs text-muted-foreground">
                    {income.length} fonte{income.length !== 1 ? 's' : ''} ativa{income.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {income.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.merchant}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.frequency === 'monthly' ? 'Mensal' : item.frequency === 'yearly' ? 'Anual' : item.frequency}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      +{fmt(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )
      ) : !hasExpenseData ? (
        <div className="space-y-4">
          {isDetecting ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analisando suas transações...</p>
            </div>
          ) : (
            <>
              <EmptyState
                icon={Repeat}
                title="Nenhuma recorrência detectada"
                description="Nenhuma assinatura ou parcela recorrente foi encontrada nas suas transações."
              />
              <div className="flex justify-center">
                <Button onClick={handleDetect} disabled={isDetecting}>
                  Detectar novamente
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <RingChart paidPercent={paidPercent} />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">
                    {fmt(monthlyTotal)}
                    <span className="text-base font-normal text-muted-foreground">/mês</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMonthOffset((o) => o - 1)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-[10rem] text-center text-sm font-medium">{monthLabel}</span>
                <button
                  onClick={() => setMonthOffset((o) => o + 1)}
                  disabled={monthOffset >= 0}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-6 border-t pt-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-muted-foreground">Parcelas:</span>
                <span className="font-medium">{fmt(installmentsTotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Recorrentes:</span>
                <span className="font-medium">{fmt(subscriptionsTotal)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDetect}
                disabled={isDetecting}
                className="ml-auto"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isDetecting && 'animate-spin')} />
                {isDetecting ? 'Detectando...' : 'Atualizar'}
              </Button>
            </div>
          </div>

          {/* Installments section */}
          {installments.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  Parcelas
                </h2>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmt(installmentsRemainingTotal)} Restante</p>
                  <p className="text-xs text-muted-foreground">
                    {installments.length} parcela{installments.length !== 1 ? 's' : ''} ativa{installments.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {installments.map((inst) => {
                  const endLabel = formatEndDate(inst.next_expected_date, inst.installments_remaining);
                  return (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                          <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{inst.merchant}</p>
                          <p className="text-xs text-muted-foreground">
                            {inst.installments_remaining != null
                              ? `${inst.installments_remaining} parcelas restantes`
                              : 'Em andamento'}
                            {endLabel && ` · ${endLabel}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {inst.installments_remaining != null && (
                          <span className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            {inst.installments_remaining}x
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleType(inst)}
                          disabled={togglingId === inst.id}
                          aria-label={`Reclassificar ${inst.merchant} como assinatura`}
                          title="Reclassificar como assinatura"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="shrink-0 text-sm font-semibold">{fmt(inst.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Subscriptions section */}
          {subscriptions.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Repeat className="h-5 w-5 text-muted-foreground" />
                  Assinaturas
                </h2>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmt(subscriptionsTotal)}/mês</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(subscriptionsTotal * 12)}/ano
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                        <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{sub.merchant}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.frequency === 'monthly' ? 'Mensal' : sub.frequency === 'yearly' ? 'Anual' : sub.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleType(sub)}
                        disabled={togglingId === sub.id}
                        aria-label={`Reclassificar ${sub.merchant} como parcela`}
                        title="Reclassificar como parcela"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => router.push(`/chat?q=${encodeURIComponent(`Vale a pena manter a assinatura ${sub.merchant} de ${fmt(sub.amount)}/mês?`)}`)}
                        aria-label={`Perguntar sobre ${sub.merchant}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Perguntar para a Cleo"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <span className="shrink-0 text-sm font-semibold">{fmt(sub.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </>
      )}
    </div>
  );
}
