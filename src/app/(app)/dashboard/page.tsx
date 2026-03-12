import type { Metadata } from 'next';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardContent />
    </div>
  );
}
