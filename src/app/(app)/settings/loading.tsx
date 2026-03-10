import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageSkeleton variant="list" />
    </div>
  );
}
