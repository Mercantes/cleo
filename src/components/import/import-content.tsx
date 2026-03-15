'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils/format';

interface PreviewData {
  count: number;
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
  }>;
  total: { income: number; expenses: number };
}

interface ImportResult {
  imported: number;
  errors: number;
  total: number;
}

export function ImportContent() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('preview', 'true');

      const res = await fetch('/api/transactions/import', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao processar arquivo');
        setFile(null);
        return;
      }

      setPreview(data);
    } catch {
      toast.error('Erro ao processar arquivo');
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/transactions/import', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro na importação');
        return;
      }

      setResult(data);
      setPreview(null);
      toast.success(`${data.imported} transações importadas!`);
    } catch {
      toast.error('Erro na importação');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      {!preview && !result && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Selecionar arquivo para importação"
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary'
          }`}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium">
            {loading ? 'Processando...' : 'Arraste um arquivo ou clique para selecionar'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Suporta CSV, TXT, OFX e QFX (máx. 5MB)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,.ofx,.qfx"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {preview.count} transações encontradas
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
                <p className="text-xs text-green-600 dark:text-green-400">Entradas</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(preview.total.income)}
                </p>
              </div>
              <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-xs text-red-600 dark:text-red-400">Saídas</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(preview.total.expenses)}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction preview list */}
          <div className="rounded-lg border bg-card">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">
                Prévia ({Math.min(preview.transactions.length, 20)} de {preview.count})
              </p>
            </div>
            <div className="max-h-64 overflow-auto">
              {preview.transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between border-b px-4 py-2 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <span className={`ml-2 text-sm font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors disabled:opacity-50"
            >
              {loading ? 'Importando...' : `Importar ${preview.count} transações`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-lg border bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <p className="mt-3 text-lg font-medium">Importação concluída!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.imported} de {result.total} transações importadas
          </p>
          {result.errors > 0 && (
            <div className="mt-3 flex items-center justify-center gap-1 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              {result.errors} transações com erro
            </div>
          )}
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={reset}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Importar outro
            </button>
            <a
              href="/transactions"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Ver transações
            </a>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="text-sm font-medium">Formatos suportados</h3>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li><strong>CSV/TXT:</strong> Colunas data, descrição e valor (separador ; ou ,)</li>
          <li><strong>OFX/QFX:</strong> Formato padrão de extrato bancário</li>
          <li>Datas em DD/MM/AAAA ou AAAA-MM-DD</li>
          <li>Valores podem usar vírgula ou ponto como separador decimal</li>
        </ul>
      </div>
    </div>
  );
}
