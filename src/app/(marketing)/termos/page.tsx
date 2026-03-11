import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos e condições de uso da Cleo, sua assistente financeira pessoal.',
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-bold">Termos de Uso</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: 10 de março de 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Aceitação dos Termos</h2>
          <p className="mt-2">
            Ao acessar e utilizar a Cleo, você concorda com estes Termos de Uso. Se você não
            concordar com qualquer parte destes termos, não utilize o serviço.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Descrição do Serviço</h2>
          <p className="mt-2">
            A Cleo é uma plataforma de gestão financeira pessoal que utiliza inteligência artificial
            para ajudar usuários a organizar suas finanças. O serviço inclui conexão bancária via
            Open Finance, categorização automática de transações, chat com IA e projeções financeiras.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Conta do Usuário</h2>
          <p className="mt-2">
            Você é responsável por manter a confidencialidade da sua conta e senha. Você concorda em
            notificar a Cleo imediatamente sobre qualquer uso não autorizado da sua conta.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Planos e Pagamentos</h2>
          <p className="mt-2">
            A Cleo oferece um plano gratuito com funcionalidades limitadas e um plano Pro com
            funcionalidades ilimitadas. O plano Pro é cobrado mensalmente via cartão de crédito.
            Cancelamentos podem ser feitos a qualquer momento pelo painel de configurações.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Conexão Bancária</h2>
          <p className="mt-2">
            A conexão com instituições financeiras é realizada via Open Finance, regulado pelo Banco
            Central do Brasil. A Cleo não armazena senhas bancárias e não tem acesso para realizar
            transações em sua conta.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Isenção de Responsabilidade</h2>
          <p className="mt-2">
            As informações e projeções fornecidas pela Cleo são apenas para fins informativos e não
            constituem aconselhamento financeiro profissional. Decisões financeiras devem ser tomadas
            com base em sua própria análise e, quando necessário, com o auxílio de um profissional
            qualificado.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Modificações</h2>
          <p className="mt-2">
            A Cleo se reserva o direito de modificar estes termos a qualquer momento. Alterações
            significativas serão comunicadas por e-mail ou notificação no aplicativo.
          </p>
        </section>
      </div>
    </div>
  );
}
