import type { Metadata } from 'next';
import { SplitsContent } from '@/components/splits/splits-content';

export const metadata: Metadata = {
  title: 'Dividir Despesas',
};

export default function SplitsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dividir Despesas</h1>
        <p className="text-sm text-muted-foreground">Divida contas com amigos e familiares</p>
      </div>
      <SplitsContent />
    </div>
  );
}
