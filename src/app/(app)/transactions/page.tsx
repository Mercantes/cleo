import type { Metadata } from 'next';
import { TransactionsPageContent } from '@/components/transactions/transactions-page-content';

export const metadata: Metadata = { title: 'Transações' };

export default function TransactionsPage() {
  return <TransactionsPageContent />;
}
