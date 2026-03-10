import type { Metadata } from 'next';
import Link from 'next/link';
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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              Cleo
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
              <a href="#como-funciona" className="transition-colors hover:text-foreground">
                Como funciona
              </a>
              <a href="#planos" className="transition-colors hover:text-foreground">
                Planos
              </a>
              <a href="#seguranca" className="transition-colors hover:text-foreground">
                Segurança
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>
      {children}
      <Footer />
    </div>
  );
}
