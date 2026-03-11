import type { Metadata } from 'next';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Entre em contato com a equipe da Cleo. Estamos aqui para ajudar.',
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-bold">Contato</h1>
      <p className="mt-2 text-muted-foreground">
        Tem alguma dúvida ou sugestão? Entre em contato conosco.
      </p>

      <div className="mt-8 space-y-6">
        <div className="flex items-start gap-4 rounded-lg border p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">E-mail</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Para dúvidas gerais, suporte técnico ou parcerias:
            </p>
            <a
              href="mailto:contato@cleo.app"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              contato@cleo.app
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-dashed p-6">
          <h2 className="font-semibold">Horário de Atendimento</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Segunda a sexta-feira, das 9h às 18h (horário de Brasília).
            <br />
            Respondemos em até 24 horas úteis.
          </p>
        </div>
      </div>
    </div>
  );
}
