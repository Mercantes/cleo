import type { Metadata } from 'next';
import { Suspense } from 'react';
import { UpgradePageContent } from '@/components/upgrade/upgrade-page-content';

export const metadata: Metadata = { title: 'Upgrade' };

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradePageContent />
    </Suspense>
  );
}
