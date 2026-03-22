import type { Metadata } from 'next';
import { UpgradeSuccessContent } from '@/components/upgrade/upgrade-success-content';

export const metadata: Metadata = { title: 'Upgrade Concluído' };

export default function UpgradeSuccessPage() {
  return <UpgradeSuccessContent />;
}
