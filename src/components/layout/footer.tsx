import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <p className="text-lg font-bold">Cleo</p>
            <p className="text-sm text-muted-foreground">
              Sua assistente financeira com IA
            </p>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/termos" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/contato" className="hover:text-foreground transition-colors">
              Contato
            </Link>
          </nav>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Cleo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
