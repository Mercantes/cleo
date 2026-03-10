import { ProjectionsContent } from '@/components/projections/projections-content';

export default function ProjectionsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projeções Financeiras</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja como suas finanças podem evoluir nos próximos meses
        </p>
      </div>
      <ProjectionsContent />
    </div>
  );
}
