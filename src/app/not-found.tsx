import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Página não encontrada | Cleo',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Image
        src="/logo.png"
        alt="Cleo"
        width={64}
        height={64}
        className="rounded-xl opacity-50"
      />
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-lg text-muted-foreground">Página não encontrada</p>
      <p className="max-w-md text-sm text-muted-foreground">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        Ir para o Dashboard
      </Link>
      <div className="flex gap-4 text-sm">
        <Link href="/chat" className="text-muted-foreground hover:text-primary hover:underline">
          Chat
        </Link>
        <Link href="/transactions" className="text-muted-foreground hover:text-primary hover:underline">
          Transações
        </Link>
        <Link href="/accounts" className="text-muted-foreground hover:text-primary hover:underline">
          Contas
        </Link>
      </div>
    </div>
  );
}
