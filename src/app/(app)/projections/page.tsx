import { ProjectionsContent } from '@/components/projections/projections-content';

export default function ProjectionsPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Projeções Financeiras</h1>
        <p className="text-sm text-muted-foreground">
          Veja como suas finanças podem evoluir nos próximos meses
        </p>
      </div>
      <ProjectionsContent />
    </div>
  );
}
