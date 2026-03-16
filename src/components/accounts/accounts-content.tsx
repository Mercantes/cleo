'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { CreditCard, Landmark, Unplug, ChevronUp, ChevronDown, RefreshCw, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import { ConnectBankButton } from '@/components/bank/connect-bank-button';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

interface AccountItem {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  bankName: string;
  bankLogo: string | null;
}

interface ConnectionItem {
  id: string;
  connectorName: string;
  connectorLogo: string | null;
  status: string;
  lastSyncAt: string | null;
  accountCount: number;
}

interface AccountsData {
  creditCards: AccountItem[];
  bankAccounts: AccountItem[];
  connections: ConnectionItem[];
  creditTotal: number;
  bankTotal: number;
}

const TYPE_LABELS: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  credit: 'Cartão de Crédito',
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: 'Atualizado', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
    updating: { label: 'Sincronizando', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
    error: { label: 'Erro', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
    outdated: { label: 'Desatualizado', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  };
  const c = config[status] || config.outdated;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', c.className)}>
      {status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
      {c.label}
    </span>
  );
}

function BankIcon({ logo, name, size = 40 }: { logo: string | null; name: string; size?: number }) {
  if (logo) {
    return (
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white">
        <Image src={logo} alt={name} width={size} height={size} className="object-contain" unoptimized />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
      <Landmark className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof CreditCard;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-lg border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">{title}</h2>
          <span className="text-sm text-muted-foreground">{count}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t">{children}</div>}
    </section>
  );
}

export function AccountsContent() {
  const { data, isLoading, mutate } = useApi<AccountsData>('/api/accounts');
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const handleSync = useCallback(async (connectionId: string) => {
    setSyncingId(connectionId);
    try {
      const res = await fetch('/api/pluggy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      toast.success(`Sincronizado! ${result.imported} novas transações.`);
      await mutate();
    } catch {
      toast.error('Erro ao sincronizar. Tente novamente.');
    } finally {
      setSyncingId(null);
    }
  }, [mutate]);

  const handleDisconnect = useCallback(async (connectionId: string) => {
    setDisconnectingId(null);
    try {
      const res = await fetch(`/api/settings/banks?id=${connectionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Banco desconectado.');
      await mutate();
    } catch {
      toast.error('Erro ao desconectar banco.');
    }
  }, [mutate]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  const creditCards = data?.creditCards || [];
  const bankAccounts = data?.bankAccounts || [];
  const connections = data?.connections || [];
  const hasData = creditCards.length > 0 || bankAccounts.length > 0 || connections.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ConnectBankButton onConnectionComplete={() => mutate()} />
      </div>

      {!hasData && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <Landmark className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">Nenhuma conta conectada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Conecte seu banco para visualizar seus cartões, contas e saldos.
            </p>
          </div>
        </div>
      )}

      {creditCards.length > 0 && (
        <CollapsibleSection title="Cartões de Crédito" icon={CreditCard} count={creditCards.length}>
          <div className="divide-y">
            {creditCards.map((card) => (
              <div key={card.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <BankIcon logo={card.bankLogo} name={card.bankName} />
                  <div>
                    <p className="text-sm font-medium">{card.name}</p>
                    <p className="text-xs text-muted-foreground">{card.bankName}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                  {fmt(card.balance)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-3 rounded bg-red-500" />
                <span className="text-sm font-medium">TOTAL</span>
              </div>
              <span className="text-sm font-bold text-red-500 dark:text-red-400">
                {fmt(data?.creditTotal || 0)}
              </span>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {bankAccounts.length > 0 && (
        <CollapsibleSection title="Contas Bancárias" icon={Landmark} count={bankAccounts.length}>
          <div className="divide-y">
            {bankAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <BankIcon logo={acc.bankLogo} name={acc.bankName} />
                  <div>
                    <p className="text-sm font-medium">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {acc.bankName} · {TYPE_LABELS[acc.type] || acc.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-semibold',
                    acc.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
                  )}>
                    {fmt(acc.balance)}
                  </p>
                  <p className="text-xs text-muted-foreground">Saldo atual</p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={cn('h-0.5 w-3 rounded', (data?.bankTotal || 0) >= 0 ? 'bg-green-500' : 'bg-red-500')} />
                <span className="text-sm font-medium">TOTAL</span>
              </div>
              <span className={cn(
                'text-sm font-bold',
                (data?.bankTotal || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
              )}>
                {fmt(data?.bankTotal || 0)}
              </span>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {connections.length > 0 && (
        <CollapsibleSection title="Conexões" icon={Unplug} count={connections.length}>
          <div className="divide-y">
            {connections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <BankIcon logo={conn.connectorLogo} name={conn.connectorName} />
                  <div>
                    <p className="text-sm font-medium">{conn.connectorName}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={conn.status} />
                      <span className="text-xs text-muted-foreground">
                        {conn.accountCount} conta{conn.accountCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSync(conn.id)}
                    disabled={syncingId === conn.id}
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    aria-label={`Sincronizar ${conn.connectorName}`}
                  >
                    {syncingId === conn.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  {disconnectingId === conn.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleDisconnect(conn.id)}
                        className="h-7 bg-red-500 text-xs hover:bg-red-600"
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDisconnectingId(null)}
                        className="h-7 text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDisconnectingId(conn.id)}
                      className="text-xs text-red-500 hover:text-red-600 hover:underline"
                    >
                      Desconectar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
