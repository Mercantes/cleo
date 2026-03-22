import type { Metadata } from 'next';
import { CategoriesPageContent } from '@/components/categories/categories-page-content';

export const metadata: Metadata = { title: 'Categorias' };

export default function CategoriesPage() {
  return <CategoriesPageContent />;
}
