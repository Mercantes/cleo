import type { Metadata } from 'next';
import { ImportContent } from '@/components/import/import-content';

export const metadata: Metadata = {
  title: 'Importar Extrato',
};

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar Extrato</h1>
        <p className="text-sm text-muted-foreground">Importe transações de arquivos CSV ou OFX</p>
      </div>
      <ImportContent />
    </div>
  );
}
