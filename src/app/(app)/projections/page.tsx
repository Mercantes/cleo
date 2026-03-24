import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectionsContent } from '@/components/projections/projections-content';
import { ProGate } from '@/components/paywall/pro-gate';

export const metadata: Metadata = { title: 'Projeções Financeiras' };

export default function ProjectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Futuro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Veja como suas finanças podem evoluir nos próximos meses
          </p>
        </div>
        <Link
          href="/retirement"
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Patrimônio
        </Link>
      </div>
      <ProGate feature="Projeção de saldo">
        <ProjectionsContent />
      </ProGate>
    </div>
  );
}
