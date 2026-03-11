import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Saiba como a Cleo protege seus dados financeiros e respeita sua privacidade.',
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-bold">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: 10 de março de 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Dados que Coletamos</h2>
          <p className="mt-2">
            Coletamos as seguintes informações: nome, e-mail, dados de transações bancárias
            (via Open Finance), categorias de gastos e histórico de conversas com a IA. Não
            coletamos senhas bancárias, números de cartão ou dados sensíveis de autenticação.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Como Usamos seus Dados</h2>
          <p className="mt-2">Seus dados são utilizados exclusivamente para:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Exibir suas transações e informações financeiras</li>
            <li>Categorizar transações automaticamente com IA</li>
            <li>Gerar projeções e análises financeiras personalizadas</li>
            <li>Responder suas perguntas no chat com contexto financeiro</li>
            <li>Detectar assinaturas e gastos recorrentes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Compartilhamento de Dados</h2>
          <p className="mt-2">
            Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins
            de marketing. Compartilhamos dados apenas com:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Pluggy (conexão bancária via Open Finance)</li>
            <li>Anthropic (processamento de IA para o chat)</li>
            <li>Stripe (processamento de pagamentos)</li>
            <li>Supabase (armazenamento seguro de dados)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Segurança</h2>
          <p className="mt-2">
            Seus dados são protegidos com criptografia em trânsito (TLS) e em repouso. O acesso
            ao banco de dados é protegido por Row Level Security (RLS), garantindo que cada
            usuário acesse apenas seus próprios dados.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Seus Direitos (LGPD)</h2>
          <p className="mt-2">
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
            <li>Solicitar a portabilidade dos seus dados</li>
          </ul>
          <p className="mt-2">
            Você pode exercer esses direitos diretamente nas{' '}
            <a href="/settings" className="text-primary underline-offset-4 hover:underline">
              Configurações da sua conta
            </a>
            , na aba &quot;Conta&quot;, onde é possível exportar seus dados ou excluir sua conta.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Retenção de Dados</h2>
          <p className="mt-2">
            Seus dados são mantidos enquanto sua conta estiver ativa. Ao excluir sua conta, todos
            os dados pessoais serão removidos em até 30 dias, exceto quando houver obrigação legal
            de retenção.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Contato</h2>
          <p className="mt-2">
            Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato
            pelo e-mail: privacidade@cleo.app
          </p>
        </section>
      </div>
    </div>
  );
}
