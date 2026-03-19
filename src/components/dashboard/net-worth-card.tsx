'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Clock, Wallet, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { useApi } from '@/hooks/use-api';

interface AccountsData {
  totalBalance: number;
  bankTotal: number;
  creditTotal: number;
  accounts?: Array<{ balance: number; name: string; type: string }>;
}

export function NetWorthCard() {
  const { data } = useApi<AccountsData>('/api/dashboard/accounts');

  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const balance = data?.totalBalance ?? 0;
  const bankTotal = data?.bankTotal ?? 0;
  const creditTotal = data?.creditTotal ?? 0;
  const hasData = data && data.totalBalance !== undefined;
  const isPositive = balance >= 0;

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Patrimônio</p>
        <Link href="/accounts" className="text-xs font-medium text-primary hover:underline">
          Ver todas ↗
        </Link>
      </div>

      <div className="mt-2">
        <span className={`text-2xl font-bold ${isPositive ? '' : 'text-red-500 dark:text-red-400'}`}>
          {fmt(balance)}
        </span>
      </div>

      {!hasData ? (
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <Clock className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Dados disponíveis após conectar banco</p>
        </div>
      ) : (
        <>
          {/* Breakdown: bank accounts vs credit cards */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                  <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Saldo em contas</p>
                  <p className="text-[11px] text-muted-foreground">Contas bancárias e investimentos</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{fmt(bankTotal)}</span>
            </div>

            {creditTotal > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                    <CreditCard className="h-4 w-4 text-red-500 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Faturas de cartão</p>
                    <p className="text-[11px] text-muted-foreground">Dívida atual em cartões</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-red-500 dark:text-red-400">-{fmt(creditTotal)}</span>
              </div>
            )}
          </div>

          {/* Visual bar: assets vs liabilities */}
          {bankTotal > 0 && (
            <div className="mt-4">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.min((bankTotal / (bankTotal + creditTotal)) * 100, 100)}%` }}
                />
                {creditTotal > 0 && (
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${Math.min((creditTotal / (bankTotal + creditTotal)) * 100, 100)}%` }}
                  />
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Ativos</span>
                <span>{creditTotal > 0 ? 'Dívidas' : ''}</span>
              </div>
            </div>
          )}

          {/* Individual accounts */}
          {data.accounts && data.accounts.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contas</p>
              <div className="space-y-1.5">
                {data.accounts.map((acc, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{acc.name}</span>
                    <span className={`font-medium ${acc.type === 'credit' ? 'text-red-500 dark:text-red-400' : ''}`}>
                      {acc.type === 'credit' ? '-' : ''}{fmt(acc.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
