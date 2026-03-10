import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function ChatLoading() {
  return (
    <div className="p-4 md:p-6">
      <PageSkeleton variant="chat" />
    </div>
  );
}
