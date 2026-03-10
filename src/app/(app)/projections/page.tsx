import { ProjectionsContent } from '@/components/projections/projections-content';

export default function ProjectionsPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold">Projeções Financeiras</h1>
      <ProjectionsContent />
    </div>
  );
}
