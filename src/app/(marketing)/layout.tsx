import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/layout/marketing-header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Cleo | Sua assistente financeira com IA',
  description:
    'Conecte seu banco, converse com IA e tome decisões financeiras inteligentes. Open Finance + IA para suas finanças pessoais.',
  openGraph: {
    title: 'Cleo | Sua assistente financeira com IA',
    description:
      'Conecte seu banco, converse com IA e tome decisões financeiras inteligentes.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Cleo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cleo | Sua assistente financeira com IA',
    description:
      'Conecte seu banco, converse com IA e tome decisões financeiras inteligentes.',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Force light mode on marketing/LP pages */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var h=document.documentElement;if(h.classList.contains('dark')){h.classList.remove('dark');h.dataset.marketingForcedLight='1';}})();`,
        }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Ir para o conteúdo principal
      </a>
      <MarketingHeader />
      <main id="main-content">{children}</main>
      <Footer />
      {/* Restore dark mode when navigating away from marketing pages */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){window.addEventListener('beforeunload',function(){var h=document.documentElement;if(h.dataset.marketingForcedLight==='1'){var t=localStorage.getItem('cleo_theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches)){h.classList.add('dark');}delete h.dataset.marketingForcedLight;}});})();`,
        }}
      />
    </div>
  );
}
