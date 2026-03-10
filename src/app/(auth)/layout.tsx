import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-8 text-2xl font-bold">
        Cleo
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          &larr; Voltar para o início
        </Link>
      </p>
    </div>
  );
}
