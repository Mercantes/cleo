import type { Metadata } from 'next';
import { SupportPageContent } from '@/components/support/support-page-content';

export const metadata: Metadata = { title: 'Suporte' };

export default function SupportPage() {
  return <SupportPageContent />;
}
