'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Repeat, CreditCard, Loader2, MessageSquare, ArrowRightLeft } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/components/ui/toast';

interface RecurringItem {
  id: string;
  merchant: string;
  amount: number;
  frequency: string;
  type: 'subscription' | 'installment';
  user_override: string | null;
  installments_remaining: number | null;
  next_expected_date: string;
  status: string;
}

interface RecurringData {
  subscriptions: RecurringItem[];
  installments: RecurringItem[];
  monthlyTotal: number;
}

export function RecurringList() {
  const router = useRouter();
  const { data, isLoading, error: fetchError, mutate } = useApi<RecurringData>('/api/recurring');
  const [isDetecting, setIsDetecting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const subscriptions = data?.subscriptions || [];
  const installments = data?.installments || [];
  const monthlyTotal = data?.monthlyTotal || 0;
  const hasData = subscriptions.length > 0 || installments.length > 0;

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

    // Optimistic update
    if (data) {
      const allItems = [...data.subscriptions, ...data.installments];
      const updated = allItems.map(i => i.id === item.id ? { ...i, type: newType as 'subscription' | 'installment' } : i);
      mutate({
        subscriptions: updated.filter(i => i.type === 'subscription'),
        installments: updated.filter(i => i.type === 'installment'),
        monthlyTotal: data.monthlyTotal,
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
      await mutate(); // Revert on error
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
      {hasData && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total mensal comprometido</p>
          <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
        </div>
      )}

      {fetchError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Não foi possível carregar suas recorrências.
        </div>
      )}

      {!hasData ? (
        <div className="space-y-4">
          <EmptyState
            icon={Repeat}
            title="Nenhuma recorrência detectada"
            description="Clique abaixo para analisar suas transações e detectar assinaturas e parcelas."
          />
          <div className="flex justify-center">
            <Button onClick={handleDetect} disabled={isDetecting}>
              {isDetecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Detectar recorrências
            </Button>
          </div>
        </div>
      ) : (
        <>
          {subscriptions.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Repeat className="h-5 w-5" />
                Assinaturas ({subscriptions.length})
              </h2>
              <div className="space-y-2">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{sub.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.frequency === 'monthly' ? 'Mensal' : sub.frequency} · Total anual:{' '}
                        {formatCurrency(sub.amount * 12)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
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
                        onClick={() => router.push(`/chat?q=${encodeURIComponent(`Vale a pena manter a assinatura ${sub.merchant} de ${formatCurrency(sub.amount)}/mês?`)}`)}
                        aria-label={`Perguntar sobre ${sub.merchant}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Perguntar para a Cleo"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <span className="shrink-0 text-sm font-semibold text-red-500 dark:text-red-400">{formatCurrency(sub.amount)}/mês</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {installments.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="h-5 w-5" />
                Parcelas ({installments.length})
              </h2>
              <div className="space-y-2">
                {installments.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{inst.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {inst.installments_remaining != null
                          ? `${inst.installments_remaining} parcelas restantes`
                          : 'Em andamento'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleType(inst)}
                        disabled={togglingId === inst.id}
                        aria-label={`Reclassificar ${inst.merchant} como assinatura`}
                        title="Reclassificar como assinatura"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="shrink-0 text-sm font-semibold text-red-500 dark:text-red-400">{formatCurrency(inst.amount)}/mês</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={handleDetect} disabled={isDetecting} size="sm">
              {isDetecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Re-analisar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
