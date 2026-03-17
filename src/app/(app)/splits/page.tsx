'use client';

import { SplitsContent } from '@/components/splits/splits-content';

export default function SplitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dividir Despesas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Divida contas com amigos e família, acompanhe quem já pagou
        </p>
      </div>
      <SplitsContent />
    </div>
  );
}
