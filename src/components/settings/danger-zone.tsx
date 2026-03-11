'use client';

import { useState } from 'react';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { signOut } from '@/lib/actions/auth';

export function DangerZone() {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch('/api/settings/account/export');
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleo-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Dados exportados com sucesso');
    } catch {
      toast('Erro ao exportar dados. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== 'EXCLUIR') return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/settings/account', { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await signOut();
    } catch {
      toast('Erro ao excluir conta. Tente novamente.');
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <div className="flex items-start gap-3">
          <Download className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Exportar meus dados</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Baixe uma cópia de todos os seus dados pessoais em formato JSON (LGPD).
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="mt-3"
            >
              {isExporting ? 'Exportando...' : 'Exportar dados'}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-700 dark:text-red-400">Excluir conta</h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400/80">
              Esta ação é irreversível. Todos os seus dados, transações, metas e histórico de chat serão
              permanentemente excluídos.
            </p>
            {!showConfirm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(true)}
                className="mt-3 border-red-300 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Excluir minha conta
              </Button>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Digite <strong>EXCLUIR</strong> para confirmar:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="max-w-[200px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleDelete}
                    disabled={confirmText !== 'EXCLUIR' || isDeleting}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
