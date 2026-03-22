'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { TransactionList } from '@/components/transactions/transaction-list';
import { toast } from '@/components/ui/toast';

export function TransactionsPageContent() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFile = useCallback(async (file: File) => {
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/transactions/import', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro na importação');
        return;
      }

      toast.success(`${data.imported} transações importadas!`);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error('Erro na importação');
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize e filtre todas as suas transações.
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={importing}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {importing ? 'Importando...' : 'Importar'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,.ofx,.qfx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      <TransactionList key={refreshKey} />
    </div>
  );
}
