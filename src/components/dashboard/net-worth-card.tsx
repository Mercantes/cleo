'use client';

import Link from 'next/link';
import { Clock, Wallet, CreditCard, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

interface ConsolidatedAccount {
  bankName: string;
  bankBalance: number;
  creditBalance: number;
  accountCount: number;
}

interface AccountsData {
  totalBalance: number;
  bankTotal: number;
  creditTotal: number;
  accounts?: ConsolidatedAccount[];
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

          {/* Consolidated accounts by bank */}
          {data.accounts && data.accounts.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contas por banco</p>
              <div className="space-y-2">
                {data.accounts.map((bank, i) => {
                  const net = bank.bankBalance - bank.creditBalance;
                  const hasCredit = bank.creditBalance > 0;
                  const hasBank = bank.bankBalance > 0;
                  return (
                    <div key={i} className="rounded-md bg-muted/30 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{bank.bankName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {bank.accountCount} {bank.accountCount === 1 ? 'conta' : 'contas'}
                          </span>
                        </div>
                        <span className={cn(
                          'text-sm font-bold tabular-nums',
                          net < 0 ? 'text-red-500 dark:text-red-400' : 'text-foreground',
                        )}>
                          {fmt(Math.abs(net))}{net < 0 ? '' : ''}
                          {net < 0 && <span className="text-[10px] font-normal"> dívida</span>}
                        </span>
                      </div>
                      {/* Sub-breakdown when bank has both account types */}
                      {hasCredit && hasBank && (
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>Saldo: <span className="text-green-600 dark:text-green-400">{fmt(bank.bankBalance)}</span></span>
                          <span>Cartão: <span className="text-red-500 dark:text-red-400">-{fmt(bank.creditBalance)}</span></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
