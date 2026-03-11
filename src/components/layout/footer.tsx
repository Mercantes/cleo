import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={28} height={28} className="rounded-md" />
              <p className="text-lg font-bold">Cleo</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Sua assistente financeira com inteligência artificial. Conecte seu banco, organize seus
              gastos e planeje seu futuro.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Produto</p>
            <nav aria-label="Produto" className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/#como-funciona" className="transition-colors hover:text-foreground">
                Como funciona
              </Link>
              <Link href="/#planos" className="transition-colors hover:text-foreground">
                Planos
              </Link>
              <Link href="/#seguranca" className="transition-colors hover:text-foreground">
                Segurança
              </Link>
            </nav>
          </div>
          <div>
            <p className="text-sm font-semibold">Legal</p>
            <nav aria-label="Legal" className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/termos" className="transition-colors hover:text-foreground">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="transition-colors hover:text-foreground">
                Política de Privacidade
              </Link>
              <Link href="/contato" className="transition-colors hover:text-foreground">
                Contato
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Cleo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
