# Cleo — Product Requirements Document (PRD)

> Assistente financeira pessoal com IA para o mercado brasileiro

**Version:** 1.0
**Date:** 2026-03-09
**Author:** Morgan (PM Agent)
**Status:** Draft

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-09 | 1.0 | Versão inicial completa do PRD | Morgan (PM) |

---

## 1. Goals

- Criar a primeira assistente financeira pessoal com IA do mercado brasileiro que elimina 100% da entrada manual de dados
- Conectar automaticamente contas bancárias via Open Finance (Pluggy) para importar transações em tempo real
- Oferecer respostas personalizadas em linguagem natural sobre a vida financeira do usuário usando Claude AI
- Projetar patrimônio futuro e estimar aposentadoria com base em dados financeiros reais
- Monetizar via modelo freemium (Free + Pro a R$ 19,90/mês) com conversão baseada em valor percebido
- Alcançar product-market fit no segmento 25-40 anos, renda > R$ 4.000, usuários de bancos digitais

## 2. Background Context

O mercado brasileiro de finanças pessoais é dominado por apps que exigem categorização manual de gastos — um modelo que 90% dos usuários abandona em semanas. Os bancos oferecem extratos, mas não interpretam os dados. Nenhum produto brasileiro combina dados automáticos via Open Finance, IA conversacional com contexto financeiro completo e projeções acionáveis de patrimônio.

A Cleo se posiciona como a resposta a essa lacuna: uma assistente que conecta o banco do usuário em menos de 1 minuto e passa a entender toda sua vida financeira — gastos, receitas, assinaturas, parcelas e patrimônio — respondendo perguntas como "Posso fazer uma viagem de R$ 5.000?" com base em dados reais, não exemplos genéricos.

A proposta de valor é clara: **"Não é sobre controlar seus gastos. É sobre entender seu dinheiro e gastar bem, do seu jeito."**

---

## 3. Personas

### 3.1 Persona Primária: Marina (A Profissional Consciente)

- **Idade:** 30 anos
- **Renda:** R$ 8.000/mês
- **Perfil:** Analista de marketing, conta no Nubank e Itaú
- **Comportamento:** Já tentou Mobills e Guiabolso, abandonou ambos em 3 semanas. Sabe que gasta mais do que deveria em delivery e assinaturas, mas não tem paciência para categorizar cada transação. Quer saber se está "indo bem" financeiramente sem precisar virar contadora.
- **Frustração principal:** "O dinheiro some e eu não sei pra onde"
- **Motivação:** Quer comprar um apartamento em 3 anos e não sabe se está no caminho certo

### 3.2 Persona Secundária: Rafael (O Early Adopter Otimizador)

- **Idade:** 27 anos
- **Renda:** R$ 12.000/mês
- **Perfil:** Dev em startup, conta no C6, Inter e Nubank
- **Comportamento:** Usa planilha do Google Sheets com fórmulas próprias. Gosta de dados e controle, mas perde tempo demais atualizando manualmente. Quer automação e inteligência sobre seus investimentos.
- **Frustração principal:** "Tenho 3 bancos e nenhum me mostra a foto completa"
- **Motivação:** Otimizar gastos para investir mais e se aposentar cedo

### 3.3 Persona Terciária: Camila (A Preocupada com o Futuro)

- **Idade:** 35 anos
- **Renda:** R$ 5.500/mês
- **Perfil:** Professora, conta no Bradesco
- **Comportamento:** Nunca usou app de finanças. Tem medo de conectar conta bancária, mas está preocupada com aposentadoria. Precisa de confiança e simplicidade extrema.
- **Frustração principal:** "Não sei se vou conseguir me aposentar"
- **Motivação:** Ter clareza sobre seu futuro financeiro sem precisar entender de investimentos

---

## 4. Jobs to Be Done (JTBD)

### JTBD 1 — Entender para onde vai meu dinheiro
> **Quando** recebo meu salário e ele some antes do fim do mês,
> **eu quero** ver automaticamente para onde foi cada real,
> **para que** eu possa identificar gastos desnecessários sem precisar categorizar nada manualmente.

### JTBD 2 — Saber se estou bem financeiramente
> **Quando** me pergunto se estou gastando demais ou economizando o suficiente,
> **eu quero** perguntar em linguagem natural e receber uma resposta baseada nos meus dados reais,
> **para que** eu tenha clareza sobre minha saúde financeira sem precisar de um consultor.

### JTBD 3 — Planejar decisões financeiras grandes
> **Quando** considero uma compra grande (viagem, carro, imóvel),
> **eu quero** simular o impacto no meu patrimônio e receber uma recomendação,
> **para que** eu tome a decisão com segurança, sabendo exatamente como isso afeta meu futuro.

### JTBD 4 — Controlar assinaturas e parcelas
> **Quando** percebo que estou pagando por serviços que não uso ou parcelas que esqueci,
> **eu quero** que a Cleo detecte automaticamente e me alerte,
> **para que** eu possa cancelar o que não faz sentido e ter visibilidade do meu comprometimento futuro.

### JTBD 5 — Projetar meu futuro financeiro
> **Quando** penso em aposentadoria ou metas de longo prazo,
> **eu quero** ver projeções realistas baseadas no meu comportamento atual,
> **para que** eu saiba se preciso ajustar algo agora para alcançar meus objetivos.

### JTBD 6 — Ter visão consolidada multi-banco
> **Quando** tenho contas em mais de um banco,
> **eu quero** ver tudo consolidado em um único lugar automaticamente,
> **para que** eu tenha a foto completa da minha vida financeira sem alternar entre apps.

---

## 5. Requirements

### 5.1 Functional Requirements

- **FR1:** O sistema deve permitir cadastro via email/senha e login social (Google) usando Supabase Auth
- **FR2:** O sistema deve exibir o Pluggy Connect Widget para o usuário conectar sua(s) conta(s) bancária(s) em menos de 1 minuto
- **FR3:** O sistema deve importar automaticamente todas as transações dos últimos 12 meses após conexão do banco via Pluggy API
- **FR4:** O sistema deve sincronizar novas transações automaticamente a cada 6 horas via webhook Pluggy
- **FR5:** O sistema deve categorizar automaticamente todas as transações usando IA (Claude API), classificando em categorias como Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, etc.
- **FR6:** O sistema deve detectar automaticamente assinaturas recorrentes (Netflix, Spotify, gym, etc.) com base em padrões de transação
- **FR7:** O sistema deve detectar automaticamente parcelas (cartão de crédito, financiamentos) e mostrar o comprometimento futuro
- **FR8:** O sistema deve apresentar um dashboard com resumo financeiro do mês corrente: receitas, despesas, saldo, comparativo com mês anterior e breakdown por categoria
- **FR9:** O sistema deve oferecer um chat em linguagem natural onde o usuário pode fazer perguntas sobre sua vida financeira e receber respostas contextualizadas com seus dados reais
- **FR10:** O sistema deve renderizar visuais inline no chat (gráficos de projeção, breakdown de categorias, comparativos) quando a resposta da IA incluir dados quantitativos
- **FR11:** O sistema deve projetar patrimônio futuro em 3, 6 e 12 meses usando modelo de juros compostos baseado no comportamento financeiro atual do usuário
- **FR12:** O sistema deve estimar idade e valor de aposentadoria com base no aporte mensal médio e rentabilidade configurável
- **FR13:** O sistema deve exibir tela de transações com filtros por categoria, banco, período e valor
- **FR14:** O sistema deve permitir que o usuário configure seu perfil financeiro: meta de aposentadoria, aporte mensal desejado, rentabilidade esperada
- **FR15:** O sistema deve implementar modelo freemium com dois tiers: Free (1 banco, 3 meses de histórico, chat limitado) e Pro (bancos ilimitados, histórico completo, chat ilimitado, alertas, projeções avançadas)
- **FR16:** O sistema deve processar pagamento do plano Pro via integração com gateway de pagamento (Stripe)
- **FR17:** O sistema deve enviar alertas proativos ao usuário quando detectar gastos incomuns, assinaturas novas ou ultrapassagem de padrão de gasto (Pro only)
- **FR18:** O sistema deve suportar conexão de múltiplos bancos simultaneamente com visão consolidada de todas as contas

### 5.2 Non-Functional Requirements

- **NFR1:** Tempo de resposta do chat com IA deve ser < 5 segundos para 95% das queries (streaming response)
- **NFR2:** A sincronização de transações via webhook deve processar em < 30 segundos após recebimento
- **NFR3:** O sistema deve implementar Row Level Security (RLS) no Supabase para garantir que cada usuário acesse apenas seus próprios dados
- **NFR4:** Tokens de acesso do Pluggy devem ser armazenados com criptografia at-rest e nunca expostos ao frontend
- **NFR5:** O sistema deve estar em conformidade com a LGPD (Lei Geral de Proteção de Dados), incluindo consentimento explícito, direito ao esquecimento e portabilidade
- **NFR6:** A aplicação deve ser responsiva (mobile-first) e funcionar em Chrome, Safari e Firefox nas últimas 2 versões
- **NFR7:** O onboarding (cadastro → conexão de banco → primeiro insight) deve ser completável em < 3 minutos
- **NFR8:** O sistema deve suportar até 10.000 usuários simultâneos sem degradação perceptível
- **NFR9:** Disponibilidade mínima de 99.5% (excluindo manutenções programadas)
- **NFR10:** O custo de IA por usuário ativo deve ser monitorado e não ultrapassar R$ 2,00/mês no tier Free
- **NFR11:** O sistema deve implementar rate limiting no chat para prevenir abuso (Free: 30 msgs/mês, Pro: ilimitado)
- **NFR12:** Todos os dados financeiros devem trafegar exclusivamente via HTTPS/TLS 1.3
- **NFR13:** O sistema deve ter cobertura de testes automatizados > 80% para lógica de negócio crítica
- **NFR14:** Deploy contínuo via Vercel com preview deployments para cada PR

---

## 6. User Interface Design Goals

### 6.1 Overall UX Vision

A interface da Cleo deve transmitir **confiança, clareza e simplicidade**. O usuário deve sentir que está conversando com uma assistente inteligente, não operando um software financeiro complexo. O tom visual é moderno, limpo e acolhedor — inspirado em apps como Nubank (simplicidade) e ChatGPT (conversação), mas com identidade própria.

Princípios de design:
- **Conversation-first:** O chat com a Cleo é o ponto focal, não formulários ou tabelas
- **Data visualization:** Números complexos se tornam gráficos claros e intuitivos
- **Progressive disclosure:** Mostrar o essencial primeiro, detalhes sob demanda
- **Zero-friction onboarding:** Do cadastro ao primeiro insight em < 3 minutos

### 6.2 Key Interaction Paradigms

- **Chat como interface primária:** Perguntas em linguagem natural com respostas visuais inline
- **Dashboard como snapshot:** Visão rápida do mês sem necessidade de navegação
- **Pull-to-refresh mental model:** Dados sempre atualizados, sem ação manual
- **Card-based layout:** Informações financeiras em cards digestíveis com drill-down

### 6.3 Core Screens and Views

1. **Landing Page** — Proposta de valor, CTA de cadastro, trust signals (Open Finance regulado pelo BC)
2. **Onboarding Flow** — Cadastro → Conexão de banco (Pluggy Widget) → Primeiro insight
3. **Dashboard** — Resumo do mês (receitas, despesas, saldo), breakdown por categoria, comparativo temporal
4. **Chat com Cleo** — Interface conversacional com respostas em texto + visuais inline (gráficos, tabelas)
5. **Transações** — Lista filtrada por categoria, banco, período, com busca
6. **Projeções** — Gráfico de patrimônio projetado, estimativa de aposentadoria, cenários "e se?"
7. **Assinaturas & Parcelas** — Detecção automática, lista com valores e datas, alerta de renovação
8. **Configurações** — Perfil financeiro (metas, aportes), conexões de banco, plano (Free/Pro), dados da conta
9. **Paywall / Upgrade** — Comparativo Free vs Pro, checkout Stripe

### 6.4 Accessibility

**WCAG AA** — Contraste adequado, navegação por teclado, labels em formulários, alt-text em gráficos

### 6.5 Branding

- **Tom:** Confiável, amigável, inteligente (não robótico)
- **Paleta:** A definir — tendência a tons de azul/verde (confiança + dinheiro) com acentos vibrantes
- **Tipografia:** Sans-serif moderna (Inter ou similar)
- **Mascote/Persona:** Cleo como assistente — presença visual sutil no chat (avatar, não personagem elaborado)

### 6.6 Target Platforms

**Web Responsive (Mobile-First)** — Prioridade para mobile (onde 80% dos usuários de banco digital acessam), mas funcional em desktop. PWA considerado para v2.

---

## 7. Technical Assumptions

### 7.1 Repository Structure

**Monorepo** — Single repository com Next.js App Router. Frontend e API routes no mesmo projeto.

### 7.2 Service Architecture

**Serverless Monolith** — Next.js App Router com:
- **Frontend:** React Server Components + Client Components
- **API:** Next.js Route Handlers (API routes)
- **Database:** Supabase (Postgres + Auth + RLS + Realtime)
- **External APIs:** Pluggy (Open Finance), Anthropic Claude (IA), Stripe (pagamentos)
- **Deploy:** Vercel (serverless functions)

Rationale: Para um MVP, a complexidade de microserviços não se justifica. Next.js App Router oferece SSR, API routes e deploy integrado na Vercel. Supabase elimina a necessidade de backend separado para auth, database e real-time.

### 7.3 Tech Stack Detalhado

| Camada | Tecnologia | Versão | Rationale |
|--------|-----------|--------|-----------|
| Framework | Next.js | 14+ (App Router) | SSR, API routes, Vercel-native |
| Linguagem | TypeScript | 5.x | Type safety, DX |
| Styling | Tailwind CSS | 3.x | Utility-first, shadcn compatibility |
| Components | shadcn/ui | latest | Composable, accessible, customizable |
| Charts | Recharts | 2.x | React-native, lightweight, responsive |
| Database | Supabase (Postgres) | latest | Auth + DB + RLS + Realtime |
| Auth | Supabase Auth | latest | Email/senha + Google OAuth |
| Open Finance | Pluggy API | v1 | Regulado pelo BC, Connect Widget |
| AI | Anthropic Claude | claude-sonnet-4-20250514 | Best cost/quality ratio para chat |
| Payments | Stripe | latest | International, webhooks, subscriptions |
| Deploy | Vercel | latest | Zero-config Next.js deploy |
| State Mgmt | Zustand | 4.x | Lightweight, simples |
| Forms | React Hook Form + Zod | latest | Validation, type-safe forms |

### 7.4 Testing Requirements

- **Unit tests:** Vitest para lógica de negócio (categorização, projeções, cálculos)
- **Integration tests:** Testing Library para componentes React
- **E2E:** Playwright para fluxos críticos (onboarding, conexão banco, chat)
- **Coverage target:** > 80% para lógica de negócio, > 60% geral

### 7.5 Additional Technical Assumptions

- Supabase Edge Functions podem ser usadas para webhook processing se necessário
- Pluggy Connect Widget é renderizado via iframe/SDK JavaScript no frontend
- Chat com IA usa streaming (Server-Sent Events) para UX de resposta progressiva
- Dados financeiros sensíveis nunca são armazenados em local storage
- API keys (Pluggy, Anthropic, Stripe) são gerenciadas via environment variables na Vercel
- Rate limiting implementado via middleware Next.js + contagem em Supabase

---

## 8. User Journey Map

### 8.1 Jornada: Primeiro Acesso → Uso Recorrente

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        JORNADA DO USUÁRIO                              │
├─────────┬───────────────────────────────────────────────────────────────┤
│ FASE    │ DESCOBERTA → CADASTRO → CONEXÃO → PRIMEIRO VALOR → HÁBITO   │
├─────────┼───────────────────────────────────────────────────────────────┤
│         │                                                               │
│ AÇÕES   │ 1. Descobre a Cleo    2. Cria conta      3. Conecta banco    │
│         │    (ad, indicação,       (email ou           (Pluggy Widget   │
│         │     organic)              Google)              < 1 min)       │
│         │                                                               │
│         │ 4. Vê primeiro        5. Faz primeira     6. Recebe alerta    │
│         │    dashboard com         pergunta no          proativo        │
│         │    resumo do mês         chat da Cleo         (assinatura     │
│         │                                               detectada)     │
│         │                                                               │
│         │ 7. Explora projeções  8. Volta no dia     9. Considera       │
│         │    de patrimônio         seguinte para        upgrade Pro    │
│         │                          checar gastos                       │
│         │                                                               │
├─────────┼───────────────────────────────────────────────────────────────┤
│ EMOÇÃO  │ Curioso → Confiante → Surpreso → Engajado → Dependente      │
├─────────┼───────────────────────────────────────────────────────────────┤
│ MÉTRICA │ Visit    Signup     Activation   Engagement    Retention     │
│         │                    (bank         (1st chat)    (D7 return)   │
│         │                     connected)                               │
└─────────┴───────────────────────────────────────────────────────────────┘
```

### 8.2 Momentos Críticos

| Momento | Risco | Mitigação |
|---------|-------|-----------|
| Conexão do banco | Medo de segurança | Trust signals, selo BC, criptografia visível |
| Primeira tela após conexão | "E agora?" | Dashboard auto-populated com insight imediato |
| Primeira pergunta no chat | Resposta genérica | Contexto financeiro real na resposta |
| Limite do Free atingido | Abandono | Mostrar valor do Pro com preview do que está perdendo |
| 7 dias sem abrir | Churn | Push notification com insight relevante (Pro) |

---

## 9. Metrics Definition

### 9.1 Activation Metrics

| Métrica | Definição | Target MVP | Como medir |
|---------|-----------|------------|------------|
| Signup Rate | Visitantes → cadastro | 15% | Supabase Auth events / page views |
| Bank Connection Rate | Cadastros → banco conectado | 60% | Pluggy connection success / signups |
| Time to First Value | Cadastro → primeiro insight | < 3 min | Timestamp diff (signup → dashboard view) |
| Activation Rate | Cadastros → banco conectado + 1 chat | 40% | Composite event tracking |

### 9.2 Engagement Metrics

| Métrica | Definição | Target MVP | Como medir |
|---------|-----------|------------|------------|
| DAU/MAU | Daily/Monthly active users | 30% | Supabase session tracking |
| Chat Sessions/Week | Perguntas por usuário por semana | 3+ | Chat message count per user |
| Dashboard Views/Week | Visitas ao dashboard por semana | 5+ | Page view tracking |
| Feature Adoption | % que usa projeções | 25% | Feature event tracking |

### 9.3 Retention Metrics

| Métrica | Definição | Target MVP | Como medir |
|---------|-----------|------------|------------|
| D1 Retention | Retorno no dia seguinte | 50% | Login events D+1 |
| D7 Retention | Retorno na semana seguinte | 35% | Login events D+7 |
| D30 Retention | Retorno no mês seguinte | 25% | Login events D+30 |
| Churn Rate | Usuários que param de usar/mês | < 10% | 30 dias sem login |

### 9.4 Monetization Metrics

| Métrica | Definição | Target MVP | Como medir |
|---------|-----------|------------|------------|
| Free → Pro Conversion | % que faz upgrade | 5% | Stripe subscription events |
| MRR | Monthly Recurring Revenue | R$ 10k (500 Pro) | Stripe dashboard |
| ARPU | Receita por usuário ativo | R$ 1,00 | MRR / MAU |
| LTV | Lifetime value | R$ 120 | ARPU × avg months retained |
| CAC | Custo de aquisição | < R$ 30 | Marketing spend / new users |
| LTV/CAC Ratio | Eficiência de aquisição | > 3:1 | LTV / CAC |

---

## 10. Epic List

### Epic 1: Foundation & Authentication
> Estabelecer infraestrutura do projeto, autenticação e layout base da aplicação. Entregar landing page funcional com fluxo de cadastro/login completo.

### Epic 2: Bank Connection & Transaction Import
> Integrar Open Finance via Pluggy para conexão de bancos, importação automática de transações e sincronização contínua via webhooks.

### Epic 3: Financial Intelligence Engine
> Implementar categorização automática por IA, detecção de assinaturas/parcelas e dashboard com resumo financeiro mensal.

### Epic 4: AI Chat Assistant
> Criar interface de chat com a Cleo usando Claude API, com respostas contextualizadas nos dados financeiros reais do usuário e visuais inline.

### Epic 5: Projections & Financial Planning
> Implementar motor de projeção de patrimônio, estimativa de aposentadoria e configurações de perfil financeiro.

### Epic 6: Monetization & Launch Readiness
> Implementar modelo freemium com Stripe, enforcement de limites por tier, paywall e polimento do onboarding para lançamento.

---

## 11. Epic Details

---

### Epic 1: Foundation & Authentication

**Goal:** Estabelecer a base técnica do projeto com Next.js, Supabase e layout responsivo, entregando landing page e fluxo completo de autenticação (email/senha + Google). Ao final, o usuário pode criar conta, fazer login e ver o shell da aplicação autenticada.

---

#### Story 1.1: Project Setup & Infrastructure

> Como desenvolvedor,
> eu quero um projeto Next.js configurado com TypeScript, Tailwind CSS e shadcn/ui,
> para que tenhamos a base técnica padronizada para todo o desenvolvimento.

**Acceptance Criteria:**
1. Projeto Next.js 14+ (App Router) inicializado com TypeScript strict mode
2. Tailwind CSS configurado com design tokens base (cores, tipografia, espaçamento)
3. shadcn/ui instalado e configurado com pelo menos Button, Input, Card e Dialog
4. ESLint + Prettier configurados com regras consistentes
5. Vitest configurado com pelo menos 1 teste de exemplo passando
6. Estrutura de diretórios definida: `src/app/`, `src/components/`, `src/lib/`, `src/types/`
7. `package.json` com scripts: dev, build, test, lint, typecheck
8. Arquivo `.env.example` com todas as variáveis de ambiente necessárias documentadas

---

#### Story 1.2: Supabase Setup & Database Schema Foundation

> Como desenvolvedor,
> eu quero Supabase configurado com o schema inicial do banco de dados,
> para que tenhamos autenticação, storage e database prontos para uso.

**Acceptance Criteria:**
1. Projeto Supabase criado e vinculado ao repositório
2. Supabase Client configurado em `src/lib/supabase/client.ts` (browser) e `src/lib/supabase/server.ts` (server)
3. Tabela `profiles` criada com: id (FK auth.users), email, full_name, avatar_url, created_at, updated_at
4. Tabela `user_settings` criada com: id, user_id (FK profiles), retirement_goal_age, monthly_contribution_target, expected_return_rate, created_at, updated_at
5. RLS habilitado em todas as tabelas com policies: usuário só acessa seus próprios dados
6. Trigger para criar profile automaticamente quando usuário se cadastra (on auth.user created)
7. Migration files versionados no repositório
8. Tipos TypeScript gerados via `supabase gen types`

---

#### Story 1.3: Authentication Flow (Email + Google)

> Como usuário,
> eu quero criar uma conta com email/senha ou Google,
> para que eu possa acessar a Cleo de forma segura e rápida.

**Acceptance Criteria:**
1. Página de cadastro com formulário: nome, email, senha (com validação Zod)
2. Página de login com email/senha
3. Botão "Continuar com Google" funcional via Supabase Auth (OAuth)
4. Redirect para `/dashboard` após login bem-sucedido
5. Redirect para `/login` quando usuário não autenticado tenta acessar rotas protegidas
6. Middleware Next.js para proteção de rotas autenticadas
7. Funcionalidade de logout
8. Tratamento de erros: email já cadastrado, senha incorreta, falha OAuth
9. Loading states em todos os botões de ação

---

#### Story 1.4: App Shell & Layout

> Como usuário autenticado,
> eu quero ver o layout base da aplicação com navegação,
> para que eu possa navegar entre as seções da Cleo.

**Acceptance Criteria:**
1. Layout autenticado com sidebar (desktop) e bottom navigation (mobile)
2. Itens de navegação: Dashboard, Chat, Transações, Projeções, Configurações
3. Header com nome do usuário, avatar e botão de logout
4. Layout responsivo: sidebar collapsa em mobile, bottom nav aparece
5. Página dashboard com placeholder "Conecte seu banco para começar"
6. Skeleton loading states para transições entre páginas
7. Componente de empty state reutilizável

---

#### Story 1.5: Landing Page

> Como visitante,
> eu quero ver uma landing page clara sobre a Cleo,
> para que eu entenda o valor do produto e decida me cadastrar.

**Acceptance Criteria:**
1. Hero section com headline, subheadline e CTA "Começar grátis"
2. Seção de proposta de valor (3 pilares: dados automáticos, IA contextual, projeções)
3. Seção de como funciona (3 steps: conecte, pergunte, planeje)
4. Seção de comparativo (Cleo vs competidores)
5. Trust signals: "Regulado pelo Banco Central", "Dados criptografados", "Não armazenamos senhas"
6. Seção de pricing (Free vs Pro)
7. Footer com links institucionais
8. CTA de cadastro redireciona para `/signup`
9. Página 100% responsiva (mobile-first)
10. Meta tags SEO e Open Graph configuradas

---

### Epic 2: Bank Connection & Transaction Import

**Goal:** Integrar a Pluggy API para permitir que o usuário conecte suas contas bancárias via Open Finance, importe automaticamente transações dos últimos 12 meses e mantenha os dados sincronizados a cada 6 horas via webhooks. Ao final, o usuário terá suas transações reais no sistema.

---

#### Story 2.1: Pluggy Integration Setup

> Como desenvolvedor,
> eu quero a Pluggy API integrada ao backend,
> para que possamos conectar contas bancárias e importar dados financeiros.

**Acceptance Criteria:**
1. Pluggy SDK/API client configurado em `src/lib/pluggy/client.ts`
2. API route `POST /api/pluggy/connect-token` que gera token de conexão para o widget
3. Tabela `bank_connections` criada: id, user_id, pluggy_item_id, connector_name, status, last_sync_at, created_at
4. Tabela `accounts` criada: id, user_id, bank_connection_id, pluggy_account_id, name, type (checking/savings/credit), balance, currency, created_at, updated_at
5. RLS em ambas as tabelas (usuário só vê seus dados)
6. Variáveis de ambiente: PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET
7. Error handling para falhas de autenticação Pluggy

---

#### Story 2.2: Bank Connection Flow (Pluggy Connect Widget)

> Como usuário,
> eu quero conectar minha conta bancária usando o widget do Open Finance,
> para que a Cleo importe meus dados financeiros automaticamente.

**Acceptance Criteria:**
1. Pluggy Connect Widget renderizado em modal/page após user clicar "Conectar banco"
2. Widget mostra lista de bancos disponíveis (Nubank, Itaú, Bradesco, BB, Inter, C6, etc.)
3. Após conexão bem-sucedida: salvar `pluggy_item_id` na tabela `bank_connections`
4. Importar contas do usuário (checking, savings, credit card) para tabela `accounts`
5. Feedback visual: loading durante conexão, sucesso com nome do banco, erro com retry
6. Suporte a múltiplas conexões (usuário pode conectar mais de um banco)
7. Status da conexão visível nas configurações

---

#### Story 2.3: Transaction Import Engine

> Como usuário que conectou o banco,
> eu quero que minhas transações dos últimos 12 meses sejam importadas automaticamente,
> para que a Cleo tenha contexto completo da minha vida financeira.

**Acceptance Criteria:**
1. Tabela `transactions` criada: id, user_id, account_id, pluggy_transaction_id, description, amount, date, type (debit/credit), category_id, raw_category, merchant, is_recurring, installment_number, installment_total, created_at
2. API route/service que busca transações dos últimos 12 meses via Pluggy API
3. Importação executada automaticamente após conexão bem-sucedida do banco
4. Tratamento de paginação da Pluggy API (importar todas as páginas)
5. Deduplicação: não importar transação com mesmo `pluggy_transaction_id`
6. Indicador de progresso durante importação inicial ("Importando transações... 340 de 1.200")
7. RLS: usuário só acessa suas transações
8. Tabela `categories` criada com categorias padrão: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Receita, Transferência, Outros

---

#### Story 2.4: Webhook Sync (Auto-refresh a cada 6h)

> Como usuário,
> eu quero que minhas transações sejam atualizadas automaticamente,
> para que eu sempre veja dados recentes sem precisar fazer nada.

**Acceptance Criteria:**
1. API route `POST /api/webhooks/pluggy` configurada para receber webhooks da Pluggy
2. Webhook handler processa eventos: `item/updated`, `transaction/created`, `transaction/updated`
3. Novas transações inseridas automaticamente na tabela `transactions`
4. Saldo das contas atualizado na tabela `accounts`
5. Campo `last_sync_at` atualizado na `bank_connections` após cada sync
6. Validação de assinatura do webhook (segurança)
7. Logging de cada sync para debugging
8. Configuração na Pluggy para sync a cada 6 horas

---

#### Story 2.5: Transaction List View

> Como usuário,
> eu quero ver a lista das minhas transações com filtros,
> para que eu possa explorar meus gastos e receitas em detalhe.

**Acceptance Criteria:**
1. Página `/transactions` com lista de transações ordenadas por data (mais recente primeiro)
2. Filtros funcionais: por categoria, por banco/conta, por período (date picker), por tipo (receita/despesa)
3. Busca por texto na descrição/merchant
4. Cada item mostra: data, descrição, categoria (com ícone/cor), valor (verde receita, vermelho despesa), banco
5. Paginação ou infinite scroll (carregar 50 por vez)
6. Indicador visual para transações recorrentes e parcelas
7. Empty state quando não há transações ou filtro não retorna resultados
8. Responsivo: layout adaptado para mobile

---

### Epic 3: Financial Intelligence Engine

**Goal:** Transformar dados brutos de transações em inteligência financeira acionável através de categorização automática por IA, detecção de padrões recorrentes e dashboard visual com resumo mensal. O usuário passa a entender para onde vai seu dinheiro sem esforço.

---

#### Story 3.1: AI-Powered Transaction Categorization

> Como usuário,
> eu quero que minhas transações sejam categorizadas automaticamente,
> para que eu veja para onde vai meu dinheiro sem categorizar nada manualmente.

**Acceptance Criteria:**
1. Service `src/lib/ai/categorizer.ts` que recebe batch de transações e retorna categorias via Claude API
2. Prompt otimizado para categorização: recebe descrição, merchant, valor e retorna categoria + confiança
3. Categorização executada automaticamente após importação e a cada sync
4. Transações com confiança < 70% marcadas para review (campo `category_confidence`)
5. Categorias mapeadas para a tabela `categories` existente
6. Batch processing: categorizar em lotes de 50 transações por request para otimizar custo
7. Fallback: se IA falhar, usar `raw_category` da Pluggy ou marcar como "Outros"
8. Custo de categorização logado para monitoramento (tokens consumidos)

---

#### Story 3.2: Recurring Transaction Detection (Subscriptions & Installments)

> Como usuário,
> eu quero que a Cleo detecte automaticamente minhas assinaturas e parcelas,
> para que eu saiba exatamente quanto estou comprometido todo mês.

**Acceptance Criteria:**
1. Service `src/lib/finance/recurring-detector.ts` que analisa transações e identifica padrões recorrentes
2. Assinaturas detectadas: mesmo merchant, mesmo valor (+/- 5%), frequência mensal, por >= 2 meses consecutivos
3. Parcelas detectadas: padrão "X/Y" na descrição ou valores idênticos em sequência com merchant igual
4. Tabela `recurring_transactions`: id, user_id, transaction_pattern, merchant, amount, frequency, type (subscription/installment), installments_remaining, next_expected_date, status (active/cancelled), created_at
5. Tela `/subscriptions` listando assinaturas ativas com: nome, valor, frequência, total anual
6. Tela mostra parcelas ativas com: nome, valor da parcela, parcelas restantes, total comprometido
7. Soma total de compromissos mensais visível no topo

---

#### Story 3.3: Monthly Financial Dashboard

> Como usuário,
> eu quero ver um resumo visual do meu mês financeiro,
> para que eu entenda minha situação financeira em segundos.

**Acceptance Criteria:**
1. Página `/dashboard` com cards: receita total, despesa total, saldo do mês, economia (receita - despesa)
2. Gráfico de barras: comparativo receita vs despesa dos últimos 6 meses
3. Gráfico de pizza/donut: breakdown de despesas por categoria (top 5 + "Outros")
4. Card de variação: "Você gastou X% a mais/menos que o mês passado"
5. Card de assinaturas: total de assinaturas ativas e valor mensal comprometido
6. Dados reais do usuário (não mockados) vindos das transações importadas
7. Loading skeleton enquanto dados carregam
8. Responsivo: cards empilham em mobile, grid em desktop
9. Seletor de mês para visualizar meses anteriores

---

### Epic 4: AI Chat Assistant

**Goal:** Implementar o chat conversacional com a Cleo usando Claude API, onde o usuário faz perguntas em linguagem natural sobre sua vida financeira e recebe respostas contextualizadas com dados reais, incluindo visuais inline como gráficos e tabelas.

---

#### Story 4.1: Chat Interface

> Como usuário,
> eu quero uma interface de chat para conversar com a Cleo,
> para que eu possa fazer perguntas sobre minhas finanças de forma natural.

**Acceptance Criteria:**
1. Página `/chat` com interface de mensagens (input na base, mensagens acima)
2. Mensagens do usuário alinhadas à direita, respostas da Cleo à esquerda (com avatar)
3. Input de texto com botão enviar e suporte a Enter para enviar
4. Mensagem de boas-vindas da Cleo com sugestões de perguntas ("Quanto gastei esse mês?", "Minhas assinaturas estão pesando?")
5. Indicador de "Cleo está digitando..." durante processamento
6. Auto-scroll para última mensagem
7. Histórico de conversas persistido no Supabase (tabela `chat_messages`: id, user_id, role, content, metadata, created_at)
8. Responsivo: tela cheia em mobile, painel lateral possível em desktop

---

#### Story 4.2: Claude API Integration with Financial Context

> Como usuário,
> eu quero que a Cleo responda minhas perguntas usando meus dados financeiros reais,
> para que as respostas sejam personalizadas e úteis, não genéricas.

**Acceptance Criteria:**
1. API route `POST /api/chat` que recebe mensagem do usuário e retorna resposta da Cleo via streaming (SSE)
2. System prompt da Cleo inclui: nome do usuário, resumo financeiro do mês (receita, despesa, saldo), top 5 categorias de gasto, assinaturas ativas, saldo de contas
3. Context window construído dinamicamente: buscar dados relevantes do Supabase antes de cada chamada
4. Streaming response: resposta aparece token por token na interface
5. Perguntas suportadas: "Quanto gastei em alimentação?", "Posso fazer uma viagem de R$ 5.000?", "Como estão minhas assinaturas?", "Quanto terei daqui a 6 meses?"
6. Rate limiting: Free (30 msgs/mês), Pro (ilimitado) — enforcement via contagem no Supabase
7. Tratamento de erro: timeout, rate limit atingido, falha na API
8. Não responder perguntas fora do escopo financeiro (redirecionar educadamente)

---

#### Story 4.3: Inline Visuals in Chat

> Como usuário,
> eu quero ver gráficos e tabelas dentro do chat quando faço perguntas sobre dados,
> para que eu entenda visualmente minhas finanças sem sair da conversa.

**Acceptance Criteria:**
1. Quando a resposta da Cleo contém dados quantitativos, renderizar visual inline (gráfico ou tabela)
2. Tipos de visuais: gráfico de barras (comparativos), gráfico de linha (projeções), tabela (breakdown de categorias), gráfico de pizza (distribuição)
3. A IA retorna metadata estruturada indicando tipo de visual e dados (JSON no response)
4. Componente `ChatVisual` que renderiza o visual correto baseado na metadata
5. Visuais responsivos: ajustam ao tamanho da mensagem
6. Fallback: se visual falhar, mostrar dados em texto formatado
7. Pelo menos 3 tipos de pergunta geram visual: "Quanto gastei por categoria?", "Como é minha projeção?", "Comparar mês atual com anterior"

---

### Epic 5: Projections & Financial Planning

**Goal:** Implementar motor de projeção de patrimônio com juros compostos, estimativa de aposentadoria e configurações de perfil financeiro, permitindo que o usuário visualize seu futuro financeiro e tome decisões informadas.

---

#### Story 5.1: Patrimony Projection Engine

> Como usuário,
> eu quero ver projeções do meu patrimônio para 3, 6 e 12 meses,
> para que eu saiba para onde minha vida financeira está indo.

**Acceptance Criteria:**
1. Service `src/lib/finance/projection-engine.ts` com cálculo de projeção baseado em: saldo atual, receita média, despesa média, taxa de rendimento
2. Modelo de juros compostos: `patrimônio_futuro = patrimônio_atual × (1 + taxa)^meses + aporte_mensal × ((1 + taxa)^meses - 1) / taxa`
3. Aporte mensal estimado = receita média - despesa média (com ajuste de sazonalidade se possível)
4. Página `/projections` com gráfico de linha mostrando projeção de patrimônio em 3, 6 e 12 meses
5. Cenários: otimista (+10% economia), realista (comportamento atual), pessimista (-10% economia)
6. Valores exibidos: patrimônio projetado em cada horizonte, aporte mensal estimado, rendimento acumulado
7. Dados baseados nas transações reais do usuário (não inputs manuais)

---

#### Story 5.2: Retirement Estimation

> Como usuário,
> eu quero saber quanto terei ao me aposentar com base no meu comportamento atual,
> para que eu possa decidir se preciso economizar mais.

**Acceptance Criteria:**
1. Seção na página `/projections` com estimativa de aposentadoria
2. Inputs configuráveis (via settings): idade atual, idade alvo de aposentadoria, rentabilidade anual esperada
3. Cálculo: patrimônio projetado na idade de aposentadoria com juros compostos sobre aporte mensal médio
4. Display: valor estimado, renda mensal que esse patrimônio geraria (regra de 4% ou configurável)
5. Comparação visual: "Sua meta: R$ X | Projeção atual: R$ Y | Gap: R$ Z"
6. Sugestão: "Para atingir sua meta, aumente seu aporte em R$ X/mês"
7. Gráfico de linha: evolução do patrimônio até a aposentadoria

---

#### Story 5.3: Financial Profile Settings

> Como usuário,
> eu quero configurar minhas metas e preferências financeiras,
> para que as projeções e recomendações da Cleo sejam personalizadas.

**Acceptance Criteria:**
1. Página `/settings` com seção "Perfil Financeiro"
2. Campos editáveis: meta de aposentadoria (valor), idade alvo de aposentadoria, aporte mensal desejado, rentabilidade anual esperada (com presets: Poupança ~7%, Renda Fixa ~10%, Renda Variável ~12%)
3. Dados salvos na tabela `user_settings` com update otimista
4. Validação: valores numéricos positivos, idade entre 18-100
5. Seção "Bancos Conectados": lista de conexões com status e botão de reconectar/remover
6. Seção "Plano": tier atual (Free/Pro), botão de upgrade, data de renovação (se Pro)
7. Seção "Conta": nome, email, botão de deletar conta (com confirmação)

---

### Epic 6: Monetization & Launch Readiness

**Goal:** Implementar o modelo freemium com Stripe para pagamentos, enforcement de limites por tier, paywall atrativo e onboarding polido, preparando o produto para lançamento público.

---

#### Story 6.1: Freemium Tier System

> Como sistema,
> eu quero enforçar limites por tier (Free vs Pro),
> para que a monetização funcione e usuários Pro tenham acesso completo.

**Acceptance Criteria:**
1. Tabela `subscriptions`: id, user_id, tier (free/pro), stripe_subscription_id, stripe_customer_id, status (active/cancelled/past_due), current_period_start, current_period_end, created_at
2. Middleware/helper `checkUserTier(userId)` que retorna tier atual e limites
3. Limites Free enforçados: 1 conexão de banco, histórico 3 meses visível, 30 msgs chat/mês
4. Limites Pro: bancos ilimitados, histórico completo, chat ilimitado, alertas ativos, projeções avançadas
5. Contador de mensagens de chat: tabela `chat_usage` ou campo em `subscriptions`
6. Quando limite Free atingido: exibir paywall inline com CTA de upgrade
7. Default: todo novo usuário começa no tier Free

---

#### Story 6.2: Stripe Payment Integration

> Como usuário,
> eu quero fazer upgrade para o plano Pro com cartão de crédito,
> para que eu tenha acesso a todos os recursos da Cleo.

**Acceptance Criteria:**
1. Stripe Checkout Session criada via API route `POST /api/stripe/checkout`
2. Dois planos configurados no Stripe: mensal (R$ 19,90) e anual (R$ 179,00)
3. Após pagamento bem-sucedido: atualizar tier do usuário para Pro no Supabase
4. Webhook `POST /api/webhooks/stripe` para processar eventos: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Cancelamento: usuário pode cancelar via settings, mantém Pro até fim do período pago
6. Tratamento de falha de pagamento: notificar usuário, grace period de 3 dias
7. Customer portal do Stripe para gerenciar método de pagamento

---

#### Story 6.3: Paywall & Upgrade Experience

> Como usuário Free,
> eu quero entender claramente o que ganho com o Pro,
> para que eu possa decidir se o upgrade vale a pena.

**Acceptance Criteria:**
1. Componente `Paywall` reutilizável que aparece quando limite Free é atingido
2. Paywall mostra: feature bloqueada, comparativo Free vs Pro, CTA "Upgrade por R$ 19,90/mês"
3. Página `/pricing` dedicada com comparativo detalhado e toggle mensal/anual
4. Preview de features Pro: ao tentar acessar feature Pro, mostrar preview borrado/limitado com CTA
5. Banner sutil no dashboard para Free users: "Você usou X de 30 mensagens. Upgrade para ilimitado"
6. Após upgrade: redirect para dashboard com mensagem de sucesso e features desbloqueadas

---

#### Story 6.4: Onboarding Flow Polish

> Como novo usuário,
> eu quero um onboarding guiado e rápido,
> para que eu conecte meu banco e veja valor em menos de 3 minutos.

**Acceptance Criteria:**
1. Fluxo step-by-step após primeiro login: "Bem-vindo à Cleo" → "Conecte seu banco" → "Tudo pronto!"
2. Step 1: Tela de boas-vindas com nome do usuário e proposta de valor (3 segundos)
3. Step 2: Pluggy Connect Widget com instrução clara e trust signals
4. Step 3: Tela de sucesso com primeiro insight do dashboard (ou loading com "Importando seus dados...")
5. Progress indicator (1/3, 2/3, 3/3)
6. Skip option: usuário pode pular e conectar depois (vai para dashboard com empty state)
7. Tempo total do onboarding < 3 minutos (meta NFR7)
8. Não mostrar onboarding novamente para usuários que já conectaram banco

---

## 12. Out of Scope (MVP)

Os seguintes itens **não** fazem parte do MVP e serão considerados em versões futuras:

- App mobile nativo (iOS/Android) — MVP é web responsiva
- Investimentos (renda variável, FIIs, crypto) — foco é conta corrente e cartão
- Open Banking write (pagamentos via Pix/TED direto da Cleo)
- Compartilhamento familiar (contas conjuntas, dependentes)
- Exportação de dados (CSV, PDF de relatórios)
- Integrações com contadores ou ERPs
- Metas de economia com gamificação
- Notificações push (requer PWA ou app nativo)
- Multi-idioma (MVP apenas pt-BR)
- White-label para fintechs

---

## 13. Roadmap

### Phase 1: MVP (Meses 1-3)
> Entregar produto funcional com todas as 6 epics acima

| Mês | Foco | Entregáveis |
|-----|------|-------------|
| 1 | Foundation + Bank Connection | Epics 1 e 2 completas. Usuário cria conta e conecta banco. |
| 2 | Intelligence + Chat | Epics 3 e 4. Dashboard, categorização e chat com IA funcionais. |
| 3 | Projections + Monetization | Epics 5 e 6. Projeções, Stripe e onboarding polido. Beta fechado. |

**Exit criteria:** 100 beta users, 60% bank connection rate, D7 retention > 30%

### Phase 2: Growth (Meses 4-6)
> Escalar base de usuários e melhorar retenção

| Feature | Descrição |
|---------|-----------|
| Push Notifications (PWA) | Alertas proativos de gastos incomuns e assinaturas |
| Insights automáticos | "Você gastou 40% mais em delivery este mês" sem precisar perguntar |
| Metas de economia | "Quero economizar R$ 500/mês" com tracking automático |
| Referral program | "Convide amigo e ganhe 1 mês Pro grátis" |
| Multi-conta consolidada | Dashboard unificado para múltiplas contas de múltiplos bancos |
| Exportação PDF | Relatório mensal exportável |

**Exit criteria:** 5.000 MAU, 5% Free→Pro conversion, MRR R$ 10k

### Phase 3: Scale (Meses 7-12)
> Expandir produto e preparar para investimento

| Feature | Descrição |
|---------|-----------|
| App mobile (React Native) | iOS e Android nativos |
| Investimentos | Tracking de renda variável, FIIs, crypto via B3/CEI |
| Open Banking payments | Pagar contas e fazer Pix direto da Cleo |
| Família | Contas compartilhadas, dependentes, visão consolidada familiar |
| API pública | Para parceiros e integrações |
| White-label | Oferecer Cleo como produto para fintechs e bancos |

**Exit criteria:** 50.000 MAU, MRR R$ 100k, preparar para Series A

---

## 14. Risks & Mitigations

### 14.1 Technical Risks

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Pluggy API instável ou com downtime | Média | Alto | Cache local de transações, retry com backoff, monitoramento de uptime Pluggy, fallback para manual import |
| Custo de IA por usuário > budget | Média | Alto | Monitorar tokens/user, otimizar prompts, cache de respostas similares, usar claude-haiku-4-5-20251001 para categorização |
| Latência do chat > 5s | Baixa | Médio | Streaming response, pré-computar contexto financeiro, cache de resumos |
| Supabase RLS mal configurado expõe dados | Baixa | Crítico | Testes automatizados de RLS, audit de segurança, pen test antes do launch |
| Pluggy descontinua ou muda pricing | Baixa | Crítico | Abstrair Pluggy atrás de interface, avaliar Belvo como alternativa |

### 14.2 Regulatory Risks

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Non-compliance LGPD | Média | Crítico | Privacy by design, consentimento explícito, DPO consultado, direito ao esquecimento implementado |
| Regulação do BC sobre uso de dados Open Finance | Baixa | Alto | Monitorar regulamentação, usar dados apenas para propósito declarado, não vender dados |
| Mudanças na regulação de IA financeira | Baixa | Médio | Disclaimers claros ("Cleo não é consultoria financeira"), termos de uso robustos |

### 14.3 Product Risks

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Baixa confiança do usuário em conectar banco | Alta | Crítico | Trust signals (selo BC, criptografia), onboarding educativo, depoimentos, "Não armazenamos senhas" |
| Categorização automática imprecisa | Média | Alto | Feedback loop (usuário corrige categoria), fine-tuning do prompt, aprendizado por usuário |
| Conversão Free→Pro < 3% | Média | Alto | A/B test de paywall, demonstrar valor Pro antes do limite, trial de 7 dias |
| Baixa retenção D30 | Alta | Crítico | Insights proativos, notificações relevantes, value demonstration constante |
| Mercado incumbent (Guiabolso, bancos) | Média | Médio | Diferenciação via IA + projeções (ninguém oferece), velocidade de execução |

---

## 15. Checklist Results Report

_(A ser preenchido após revisão do PRD pelo time)_

---

## 16. Next Steps

### 16.1 UX Expert Prompt

> @ux-design-expert: Revise o PRD de `docs/prd.md` e crie o design system foundation, wireframes das core screens (Dashboard, Chat, Transações, Projeções, Onboarding) e o fluxo de interação completo. Priorize mobile-first, conversation-first UX. Documente em `docs/architecture/frontend-spec.md`.

### 16.2 Architect Prompt

> @architect: Analise o PRD em `docs/prd.md` e crie a arquitetura técnica completa: database schema detalhado, API routes, integrações (Pluggy, Claude, Stripe), security model (RLS, encryption), e plano de deployment. Documente em `docs/architecture/system-architecture.md`. Stack definida: Next.js 14 (App Router) + Supabase + Pluggy + Claude + Stripe + Vercel.
