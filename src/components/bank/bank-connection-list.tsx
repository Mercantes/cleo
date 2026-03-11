'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Landmark, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectBankButton } from './connect-bank-button';

interface BankConnection {
  id: string;
  connector_name: string;
  status: string;
  last_sync_at: string | null;
  accounts: { id: string; name: string; type: string; balance: number }[];
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; className: string }> =
  {
    active: { label: 'Ativo', icon: CheckCircle, className: 'text-green-600 dark:text-green-400' },
    error: { label: 'Erro', icon: AlertCircle, className: 'text-destructive' },
    outdated: { label: 'Desatualizado', icon: Clock, className: 'text-yellow-600 dark:text-yellow-400' },
    updating: { label: 'Atualizando', icon: RefreshCw, className: 'text-blue-600 dark:text-blue-400' },
  };

export function BankConnectionList() {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const { data, error: queryError } = await supabase
        .from('bank_connections')
        .select('id, connector_name, status, last_sync_at, accounts(id, name, type, balance)')
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(true);
      } else {
        setConnections((data as unknown as BankConnection[]) || []);
      }
      setIsLoading(false);
    }

    load().catch(() => { setError(true); setIsLoading(false); });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-950">
        <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-300">Não foi possível carregar seus bancos conectados.</p>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Landmark className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum banco conectado ainda.</p>
        <div className="mt-4">
          <ConnectBankButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((conn) => {
        const status = statusConfig[conn.status] || statusConfig.error;
        const StatusIcon = status.icon;

        return (
          <div key={conn.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{conn.connector_name}</p>
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className={cn('h-3.5 w-3.5', status.className)} />
                    <span className={cn('text-xs', status.className)}>{status.label}</span>
                    {conn.last_sync_at && (
                      <span className="text-xs text-muted-foreground">
                        · Sincronizado{' '}
                        {new Date(conn.last_sync_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {conn.accounts.length > 0 && (
              <div className="mt-3 space-y-1 border-t pt-3">
                {conn.accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{acc.name}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(acc.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="pt-2">
        <ConnectBankButton />
      </div>
    </div>
  );
}
