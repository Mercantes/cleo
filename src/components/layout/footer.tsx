import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Cleo" width={28} height={28} className="rounded-md" />
              <p className="text-lg font-bold">Cleo</p>
            </div>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Sua assistente financeira com inteligência artificial. Conecte seu banco, organize seus gastos e planeje seu futuro.
            </p>
          </div>

          {/* Produto */}
          <div>
            <p className="text-sm font-semibold">Produto</p>
            <nav aria-label="Produto" className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/#funcionalidades" className="transition-colors hover:text-foreground">
                Funcionalidades
              </Link>
              <Link href="/#planos" className="transition-colors hover:text-foreground">
                Planos
              </Link>
              <Link href="/#seguranca" className="transition-colors hover:text-foreground">
                Segurança
              </Link>
              <Link href="/signup" className="transition-colors hover:text-foreground">
                Criar conta
              </Link>
              <Link href="/login" className="transition-colors hover:text-foreground">
                Login
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p className="text-sm font-semibold">Legal</p>
            <nav aria-label="Legal" className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/termos" className="transition-colors hover:text-foreground">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="transition-colors hover:text-foreground">
                Política de Privacidade
              </Link>
            </nav>
          </div>

          {/* Suporte */}
          <div>
            <p className="text-sm font-semibold">Suporte</p>
            <nav aria-label="Suporte" className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/contato" className="transition-colors hover:text-foreground">
                Contato
              </Link>
              <a href="mailto:suporte@usecleo.com.br" className="transition-colors hover:text-foreground">
                suporte@usecleo.com.br
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Cleo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
