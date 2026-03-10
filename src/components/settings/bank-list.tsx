'use client';

import { useState } from 'react';
import { Landmark, Trash2 } from 'lucide-react';

interface BankConnection {
  id: string;
  connector_name: string;
  status: string;
  last_sync_at: string | null;
}

interface BankListProps {
  connections: BankConnection[];
  onDisconnect: (id: string) => void;
}

export function BankList({ connections, onDisconnect }: BankListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (connections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Landmark className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Nenhum banco conectado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
                  ? `Última sync: ${new Date(conn.last_sync_at).toLocaleDateString('pt-BR')}`
                  : 'Nunca sincronizado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                conn.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
              }`}
            >
              {conn.status === 'active' ? 'Ativo' : conn.status}
            </span>
            {confirmId === conn.id ? (
              <div className="flex gap-1">
                <button
                  onClick={() => { onDisconnect(conn.id); setConfirmId(null); }}
                  className="rounded bg-red-500 px-2 py-1 text-xs text-white"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="rounded bg-muted px-2 py-1 text-xs"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(conn.id)}
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
