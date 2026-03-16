'use client';

import { ProjectionsContent } from '@/components/projections/projections-content';
import { ProGate } from '@/components/paywall/pro-gate';

export default function ProjectionsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projeções Financeiras</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja como suas finanças podem evoluir nos próximos meses
        </p>
      </div>
      <ProGate feature="Projeção de saldo">
        <ProjectionsContent />
      </ProGate>
    </div>
  );
}
