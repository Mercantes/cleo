import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Acessar sua conta',
  robots: { index: false, follow: false },
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <a
        href="#auth-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Ir para o formulário
      </a>
      <Link href="/" className="mb-8 flex items-center gap-3">
        <Image src="/logo.png" alt="Cleo" width={48} height={48} className="rounded-xl" />
        <span className="text-2xl font-bold tracking-tight">Cleo</span>
      </Link>
      <div id="auth-content" className="w-full max-w-5xl">{children}</div>
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          &larr; Voltar para o início
        </Link>
      </p>
    </div>
  );
}
