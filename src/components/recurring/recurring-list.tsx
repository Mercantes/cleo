'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Repeat, CreditCard, Loader2, MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';

interface RecurringItem {
  id: string;
  merchant: string;
  amount: number;
  frequency: string;
  type: 'subscription' | 'installment';
  installments_remaining: number | null;
  next_expected_date: string;
  status: string;
}

export function RecurringList() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<RecurringItem[]>([]);
  const [installments, setInstallments] = useState<RecurringItem[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecurring();
  }, []);

  async function fetchRecurring() {
    try {
      const res = await fetch('/api/recurring', { cache: 'no-store' });
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setInstallments(data.installments || []);
      setMonthlyTotal(data.monthlyTotal || 0);
    } catch {
      setError('Não foi possível carregar suas recorrências.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDetect() {
    setIsDetecting(true);
    setError(null);
    try {
      const res = await fetch('/api/recurring/detect', { method: 'POST' });
      if (!res.ok) throw new Error();
      await fetchRecurring();
    } catch {
      setError('Não foi possível detectar recorrências. Tente novamente.');
    } finally {
      setIsDetecting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  const hasData = subscriptions.length > 0 || installments.length > 0;

  return (
    <div className="space-y-6">
      {hasData && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total mensal comprometido</p>
          <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
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
                    <div>
                      <p className="text-sm font-medium">{sub.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.frequency === 'monthly' ? 'Mensal' : sub.frequency} · Total anual:{' '}
                        {formatCurrency(sub.amount * 12)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/chat?q=${encodeURIComponent(`Vale a pena manter a assinatura ${sub.merchant} de ${formatCurrency(sub.amount)}/mês?`)}`)}
                        aria-label={`Perguntar sobre ${sub.merchant}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Perguntar para a Cleo"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-semibold text-red-500 dark:text-red-400">{formatCurrency(sub.amount)}/mês</span>
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
                    <div>
                      <p className="text-sm font-medium">{inst.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {inst.installments_remaining != null
                          ? `${inst.installments_remaining} parcelas restantes`
                          : 'Em andamento'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-red-500 dark:text-red-400">{formatCurrency(inst.amount)}/mês</span>
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
