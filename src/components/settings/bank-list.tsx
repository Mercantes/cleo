'use client';

import { useState } from 'react';
import { Landmark, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectBankButton } from '@/components/bank/connect-bank-button';
import { toast } from '@/components/ui/toast';

interface BankConnection {
  id: string;
  connector_name: string;
  status: string;
  last_sync_at: string | null;
}

interface BankListProps {
  connections: BankConnection[];
  onDisconnect: (id: string) => void;
  onRefresh?: () => void;
}

export function BankList({ connections, onDisconnect, onRefresh }: BankListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  async function handleSync(connectionId: string) {
    setSyncingId(connectionId);
    try {
      const response = await fetch('/api/pluggy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });

      if (!response.ok) {
        toast('Erro ao sincronizar. Tente novamente.');
        return;
      }

      const result = await response.json();
      toast(`Sincronizado! ${result.imported} novas transações.`);
      onRefresh?.();
    } catch {
      toast('Erro ao sincronizar. Tente novamente.');
    } finally {
      setSyncingId(null);
    }
  }

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <Landmark className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="font-medium">Nenhum banco conectado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Conecte seu banco para importar transações automaticamente.
          </p>
        </div>
        <ConnectBankButton />
      </div>
    );
  }

  function formatStatus(status: string) {
    switch (status) {
      case 'active': return 'Ativo';
      case 'updating': return 'Sincronizando...';
      case 'error': return 'Erro';
      default: return status;
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'updating': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ConnectBankButton />
      </div>
      {connections.map((conn) => (
        <div key={conn.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{conn.connector_name}</p>
              <p className="text-xs text-muted-foreground">
                {conn.last_sync_at
                  ? `Última sync: ${new Date(conn.last_sync_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  : 'Nunca sincronizado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor(conn.status)}`}>
              {formatStatus(conn.status)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSync(conn.id)}
              disabled={syncingId === conn.id || conn.status === 'updating'}
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              aria-label={`Sincronizar ${conn.connector_name}`}
            >
              {syncingId === conn.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            {confirmId === conn.id ? (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => { onDisconnect(conn.id); setConfirmId(null); }}
                  className="h-7 bg-red-500 text-xs hover:bg-red-600"
                >
                  Confirmar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmId(null)}
                  className="h-7 text-xs"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirmId(conn.id)}
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                aria-label={`Desconectar ${conn.connector_name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
