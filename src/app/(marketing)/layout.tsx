import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/layout/marketing-header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Cleo — Sua assistente financeira com IA',
  description:
    'Conecte seu banco, converse com IA e tome decisões financeiras inteligentes. Open Finance + IA para suas finanças pessoais.',
  openGraph: {
    title: 'Cleo — Sua assistente financeira com IA',
    description:
      'Conecte seu banco, converse com IA e tome decisões financeiras inteligentes.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Cleo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cleo — Sua assistente financeira com IA',
    description:
      'Conecte seu banco, converse com IA e tome decisões financeiras inteligentes.',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      {children}
      <Footer />
    </div>
  );
}
