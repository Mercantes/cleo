# QA Fix Request — Cleo Full Application Audit

**De:** Quinn (@qa) — Guardião da Qualidade
**Para:** @dev (Dex)
**Data:** 2026-03-24
**Tipo:** Full Application Audit (non-story)
**Veredicto Geral:** CONCERNS

---

## Resumo Executivo

Auditoria completa da aplicação Cleo cobrindo 4 frentes: Segurança, Testes, Performance e Qualidade de Código. Foram identificados **9 CRITICAL**, **17 HIGH**, **17 MEDIUM** e **9 LOW** issues. As correções estão priorizadas abaixo por severidade e impacto.

---

## CRITICAL (Bloqueia deploy — corrigir imediatamente)

### C1. Service Role Key exposta em rotas de usuário

- **Arquivos:** `src/app/api/tier/route.ts`, `src/app/api/pluggy/webhook/route.ts`, `src/app/api/bank/sync/route.ts`, `src/app/api/bank/connect/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/api/stripe/checkout/route.ts`
- **Problema:** 6+ rotas user-facing usam `createClient()` com `SUPABASE_SERVICE_ROLE_KEY`, que bypassa RLS completamente. Um leak dessa key dá acesso total ao banco.
- **Fix esperado:** Criar um helper `getServiceClient()` centralizado em `src/lib/supabase/service.ts` (já existe um em `src/lib/stripe/subscription.ts` — consolidar). Para rotas que recebem request de usuário autenticado, usar o client autenticado (`createServerClient`) sempre que possível. Usar service client APENAS quando necessário (webhooks sem sessão de usuário).
- **Verificação:** Grep por `createClient.*SERVICE_ROLE` — deve aparecer apenas em 1 arquivo centralizado.

### C2. Webhook Stripe sem verificação de idempotência

- **Arquivo:** `src/app/api/stripe/webhook/route.ts`
- **Problema:** O webhook processa eventos do Stripe sem verificar se o evento já foi processado. Stripe pode reenviar eventos, causando ações duplicadas (ex: criar subscription 2x).
- **Fix esperado:** Adicionar tabela `stripe_events` com `event_id` unique. Antes de processar, verificar se `event_id` já existe. Se sim, retornar 200 sem processar.
- **Verificação:** Enviar mesmo evento 2x via `stripe trigger` — segunda vez deve ser no-op.

### C3. Webhook Stripe sem validação de assinatura

- **Arquivo:** `src/app/api/stripe/webhook/route.ts`
- **Problema:** Se `STRIPE_WEBHOOK_SECRET` não estiver configurado, o webhook aceita qualquer payload sem validar assinatura. Um atacante pode forjar eventos.
- **Fix esperado:** Se `STRIPE_WEBHOOK_SECRET` não existir, retornar 500 imediatamente. Nunca processar sem `stripe.webhooks.constructEvent()`.
- **Verificação:** Enviar POST manual sem header `stripe-signature` — deve retornar 400.

### C4. Memory leak no contextCache

- **Arquivo:** `src/lib/ai/financial-context.ts`
- **Problema:** `contextCache` é um `Map` in-memory com TTL de 5min mas sem eviction. Em serverless (Vercel), cada cold start cria novo Map, mas em containers long-lived, o Map cresce indefinidamente.
- **Fix esperado:** Usar `Map` com eviction (LRU) ou simplesmente não cachear (Vercel functions são efêmeras). Se mantiver cache, adicionar `maxSize` e cleanup periódico.
- **Verificação:** Verificar que o Map nunca excede N entries.

### C5. SQL Injection via ilike em query_transactions

- **Arquivo:** `src/lib/ai/tools/query-transactions.ts:87`
- **Problema:** O valor de `input.merchant` é interpolado diretamente no pattern `%${input.merchant}%` passado ao `.ilike()`. Embora o Supabase client use prepared statements, caracteres especiais de LIKE (`%`, `_`) não são escapados, permitindo pattern injection.
- **Fix esperado:** Escapar `%` e `_` no input antes de passar ao ilike: `merchant.replace(/%/g, '\\%').replace(/_/g, '\\_')`.
- **Verificação:** Buscar por merchant `%` — deve retornar 0 resultados, não todas as transações.

### C6. Stripe checkout sem rate limiting

- **Arquivo:** `src/app/api/stripe/checkout/route.ts`
- **Problema:** Nenhum rate limit na criação de checkout sessions. Um atacante pode criar milhares de sessions, gerando custos no Stripe.
- **Fix esperado:** Adicionar rate limit (ex: 5 sessions/minuto por userId) usando `usage_tracking` ou um header-based limiter.
- **Verificação:** 6ª request em 1 minuto deve retornar 429.

### C7. Fallback key do Stripe em produção

- **Arquivo:** `src/lib/stripe/client.ts`
- **Problema:** `process.env.STRIPE_SECRET_KEY || 'sk_not_configured'` — se a env var não estiver setada, o SDK inicializa com uma key inválida e falha silenciosamente em runtime.
- **Fix esperado:** Throw error se `STRIPE_SECRET_KEY` não existir em produção. Manter fallback apenas em `NODE_ENV === 'test'`.
- **Verificação:** Build sem `STRIPE_SECRET_KEY` em prod deve falhar no startup.

### C8. Chat route sem sanitização de input

- **Arquivo:** `src/app/api/chat/route.ts`
- **Problema:** A mensagem do usuário é passada diretamente ao Claude sem sanitização. Prompt injection pode fazer o AI executar tools maliciosamente.
- **Fix esperado:** Adicionar validação de tamanho máximo (ex: 2000 chars) e sanitizar caracteres de controle. Para tools, validar que o AI não está chamando tools com inputs fabricados pelo usuário.
- **Verificação:** Mensagem com >2000 chars deve retornar erro. Prompt injection "ignore previous instructions" não deve alterar comportamento.

### C9. getServiceClient duplicado 13x

- **Arquivo:** Múltiplos arquivos em `src/app/api/`, `src/lib/stripe/subscription.ts`
- **Problema:** A função `getServiceClient()` (ou equivalente `createClient(url, serviceKey)`) é duplicada em 13+ locais. Qualquer mudança de configuração precisa ser replicada em todos.
- **Fix esperado:** Criar `src/lib/supabase/service.ts` com um único `getServiceClient()`. Todos os consumidores importam dele.
- **Verificação:** Grep `createClient.*SERVICE_ROLE` — apenas 1 ocorrência no arquivo centralizado.

---

## HIGH (Corrigir antes do próximo release)

### H1. query_transactions sem testes

- **Arquivo:** `src/lib/ai/tools/query-transactions.ts`
- **Problema:** Tool recém-criada sem nenhum teste unitário. É a tool mais usada pela Cleo.
- **Fix esperado:** Criar `tests/unit/ai/query-transactions.test.ts` com cobertura para: filtros por data, merchant, categoria, tipo, valores min/max, limite, caso vazio, erro do Supabase.
- **Verificação:** `npm run test -- query-transactions` — todos passam.

### H2. Goals streak query N+1

- **Arquivo:** `src/lib/finance/goals.ts` (ou equivalente)
- **Problema:** Cálculo de streak faz query individual por dia para verificar contribuições. Para streak de 30 dias = 30 queries.
- **Fix esperado:** Buscar todas as contribuições do período em uma única query e calcular streak no application layer.
- **Verificação:** Streak de 30 dias deve gerar apenas 1 query ao DB.

### H3. Webhook Pluggy sem validação de origem

- **Arquivo:** `src/app/api/pluggy/webhook/route.ts`
- **Problema:** Não valida que o request vem realmente da Pluggy (sem secret/signature check).
- **Fix esperado:** Validar webhook secret da Pluggy no header. Se não validar, retornar 401.
- **Verificação:** Request sem header de autenticação deve retornar 401.

### H4. CORS não configurado nas API routes

- **Arquivo:** `src/middleware.ts` ou `next.config.ts`
- **Problema:** Nenhuma configuração de CORS explícita. Em prod, isso pode permitir requests de qualquer origem às APIs.
- **Fix esperado:** Configurar CORS no middleware para permitir apenas o domínio de produção (`cleo-app-iota.vercel.app`) e localhost em dev.
- **Verificação:** Request de domínio diferente deve ser bloqueado.

### H5. Falta de validação de input nas API routes

- **Arquivos:** `src/app/api/chat/route.ts`, `src/app/api/bank/connect/route.ts`, `src/app/api/goals/route.ts`
- **Problema:** Inputs de request body não são validados com schema (Zod, etc.). Valores inesperados podem causar erros ou comportamento indefinido.
- **Fix esperado:** Adicionar validação Zod nos bodies de todas as API routes POST/PUT.
- **Verificação:** Body inválido deve retornar 400 com mensagem clara.

### H6. Sem testes de integração para Stripe flows

- **Problema:** Checkout → webhook → tier update não tem teste end-to-end.
- **Fix esperado:** Criar teste que simula o fluxo completo usando mocks do Stripe SDK.
- **Verificação:** Teste verifica que após `checkout.session.completed`, o tier muda para 'pro'.

### H7. Error boundaries incompletos

- **Arquivos:** `src/app/dashboard/page.tsx`, `src/app/chat/page.tsx`
- **Problema:** Se um componente filho crashar, a página inteira fica em branco sem feedback ao usuário.
- **Fix esperado:** Adicionar Error Boundaries em páginas críticas (dashboard, chat, transactions).
- **Verificação:** Simular erro em componente filho — deve mostrar fallback UI.

### H8. Projeções sem validação de dados insuficientes

- **Arquivo:** `src/lib/finance/projections.ts`
- **Problema:** Se o usuário tem <3 meses de dados, as projeções podem ser imprecisas sem aviso.
- **Fix esperado:** Mostrar disclaimer quando dados históricos < 3 meses. Marcar projeção como "estimativa preliminar".
- **Verificação:** Usuário novo com 1 mês de dados vê aviso de estimativa preliminar.

### H9. useTier hook sem retry on error

- **Arquivo:** `src/hooks/use-tier.ts`
- **Problema:** Se a fetch inicial falha, o hook retorna `tier: 'free'` sem retry. Usuário Pro pode perder acesso temporariamente.
- **Fix esperado:** Adicionar retry com backoff (1s, 2s, 4s) ou usar SWR/React Query com retry built-in.
- **Verificação:** Se `/api/usage` falha na primeira tentativa, hook retenta automaticamente.

### H10. Subscription cancel não limpa dados Pro

- **Arquivo:** `src/lib/stripe/subscription.ts`
- **Problema:** Quando subscription é cancelada, o tier muda para 'free' mas dados Pro (ex: conexões bancárias extras) permanecem.
- **Fix esperado:** Documentar comportamento — decidir se dados Pro são mantidos (read-only) ou removidos. Implementar de acordo.
- **Verificação:** Após cancel, funcionalidades Pro são bloqueadas mas dados históricos permanecem visíveis.

### H11. Chat messages sem paginação

- **Arquivo:** `src/app/api/chat/route.ts`, `src/hooks/use-chat.ts`
- **Problema:** Carrega todas as mensagens de chat do histórico sem paginação. Usuários com muitas conversas terão load lento.
- **Fix esperado:** Implementar cursor-based pagination (carregar últimas 50 mensagens, load more on scroll).
- **Verificação:** Usuário com 200+ mensagens carrega apenas últimas 50 inicialmente.

### H12. Recurring transactions sem tratamento de edge cases

- **Arquivo:** `src/lib/ai/tools/manage-recurring.ts`
- **Problema:** Não trata casos como: valor negativo, data inválida, duplicata de recurring com mesmo merchant.
- **Fix esperado:** Validar inputs e retornar mensagens de erro claras para cada edge case.
- **Verificação:** Criar recurring com valor negativo retorna erro descritivo.

### H13. Category filter post-query ineficiente

- **Arquivo:** `src/lib/ai/tools/query-transactions.ts:113-120`
- **Problema:** Filtro de categoria é feito no application layer após buscar todas as transações. Se o usuário tem 10K transações e filtra por categoria, todas são carregadas do DB.
- **Fix esperado:** Mover filtro para query level usando `.eq('category_id', categoryId)` — requer lookup do category_id primeiro.
- **Verificação:** Query com filtro de categoria gera SQL com WHERE na query, não filtragem JS.

### H14. formatCurrency sem tratamento de NaN

- **Arquivo:** `src/lib/utils/format.ts`
- **Problema:** Se `amount` for NaN ou undefined, `formatCurrency()` pode retornar "R$ NaN".
- **Fix esperado:** Retornar "R$ 0,00" ou string vazia para valores inválidos.
- **Verificação:** `formatCurrency(NaN)` retorna "R$ 0,00".

### H15. Sem CSP (Content Security Policy)

- **Arquivo:** `next.config.ts` ou `src/middleware.ts`
- **Problema:** Sem Content Security Policy configurada, o app é vulnerável a XSS via scripts injetados.
- **Fix esperado:** Adicionar CSP headers no middleware. Mínimo: `default-src 'self'; script-src 'self'`.
- **Verificação:** Response headers incluem `Content-Security-Policy`.

### H16. Build warning: robots.ts encoding

- **Arquivo:** `src/app/robots.ts`
- **Problema:** A correção de syntax do quote duplo pode ter deixado encoding issues.
- **Fix esperado:** Verificar que o build está 100% limpo sem warnings.
- **Verificação:** `npm run build` sem warnings.

### H17. Checkout session sem metadata do plano

- **Arquivo:** `src/app/api/stripe/checkout/route.ts`
- **Problema:** A session de checkout não inclui metadata suficiente para debugging (plano, origem, etc.).
- **Fix esperado:** Adicionar `metadata: { plan: 'pro', source: 'upgrade-page' }` na session.
- **Verificação:** Checkout session no Stripe Dashboard mostra metadata.

---

## MEDIUM (Corrigir no próximo sprint)

### M1. Sem testes para grace period flow

### M2. Dashboard components sem loading skeletons

### M3. Dark mode inconsistente em componentes de paywall

### M4. Sem logging estruturado (apenas console.log/error)

### M5. Chat usage tracking pode race condition em requests concorrentes

### M6. Transações sem index em (user_id, date) — pode ficar lento com volume

### M7. Sem health check endpoint para monitoring

### M8. Onboarding flow não persiste progresso parcial

### M9. Sem testes para manage-recurring tool

### M10. Sem testes para create-challenge tool

### M11. Sem testes para create-budget tool

### M12. Sem testes para categorize-transaction tool

### M13. Subscription page sem estado de loading durante checkout redirect

### M14. Sem timeout no fetch da financial-context

### M15. Date handling sem timezone awareness (pode causar bugs à meia-noite)

### M16. Sem audit log de ações sensíveis (tier changes, subscription events)

### M17. Error messages exposing internal details ao usuário

---

## LOW (Backlog — nice to have)

### L1. Console.log em código de produção (vários arquivos)

### L2. Tipos `any` em 5+ locais

### L3. Imports não utilizados em alguns componentes

### L4. Falta de aria-labels em botões de ação

### L5. Sem testes de acessibilidade (a11y)

### L6. package.json scripts poderiam ter task de typecheck no CI

### L7. Sem pre-commit hook para lint

### L8. README desatualizado com instruções de setup

### L9. .env.example incompleto

---

## Ordem de Execução Sugerida

| Prioridade   | Issues                 | Estimativa              |
| ------------ | ---------------------- | ----------------------- |
| **Sprint 1** | C1, C2, C3, C5, C7, C9 | Segurança & Infra       |
| **Sprint 2** | C4, C6, C8, H1, H5     | Performance & Validação |
| **Sprint 3** | H2-H4, H6-H7           | Robustez                |
| **Sprint 4** | H8-H17                 | Melhorias               |
| **Backlog**  | M1-M17, L1-L9          | Gradual                 |

---

## Critérios de Aceite da QA

Para cada fix:

1. Teste unitário cobrindo o cenário corrigido
2. Sem regressões nos 228 testes existentes
3. Lint + typecheck passando
4. Build limpo sem warnings

---

_— Quinn, guardião da qualidade_
