## Diagnóstico do Estado Atual
- O frontend atual é React + Vite (não é Next.js), com navegação interna por estado e hash (ex.: `#dashboard`).
- O modelo de dados atual está em [types.ts](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/types.ts):
  - Persistir no PocketBase: `Bill`, `Category`, `AuditLog`.
  - Não persistir (derivado/UI): `FinancialSummary`, `DateRangeFilter`, `CalendarEvent`.
- Já existe um script de schema PocketBase em [setup_schema.js](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/scripts/setup_schema.js), mas ele precisa ser alinhado ao `types.ts` e às regras/otimizações exigidas.

## Mapeamento de Entidades → Coleções PocketBase (Backend-First)
- **`rastreador_de_vencimentos_usuarios` (auth)**
  - Campos: `role` (select: admin|user, required).
  - Auth config: `allowEmailAuth=true`, `requireEmail=true`, `minPasswordLength=8`.
  - Rules: `create: ""` (público), demais: `id = @request.auth.id` (conforme sua regra).
- **`rastreador_de_vencimentos_categorias` (base)**
  - Campos: `name` (text, required), `color` (text, required), `icon` (text, optional), `user` (relation → usuarios, maxSelect=1, cascadeDelete=true).
  - Rules (RBAC padrão): `user = @request.auth.id || @request.auth.role = 'admin'`.
- **`rastreador_de_vencimentos_contas` (base)** (ou manter `_bills` se você preferir padronizar com o código)
  - Campos principais: `name` (text), `amount` (number), `paidAmount` (number opt), `issueDate` (date), `dueDate` (date), `paymentDate` (datetime opt), `paymentMethod` (select), `exactPaymentTimestamp` (datetime opt), `delayDays` (number), `status` (select com todos os estados do app: paid, paid_partial, pending, overdue, on_time, early), `isRecurring` (bool), `frequency` (select), `category` (relation → categorias, maxSelect=1, cascadeDelete=true, optional), `notes` (text opt), `receiptId` (text opt), `user` (relation → usuarios, maxSelect=1, cascadeDelete=true).
  - Rules (RBAC padrão): `user = @request.auth.id || @request.auth.role = 'admin'`.
- **`rastreador_de_vencimentos_audit_logs` (base)**
  - Campos: `bill` (relation → contas, maxSelect=1), `user` (relation → usuarios, maxSelect=1), `fieldChanged` (text), `oldValue` (text opt), `newValue` (text), `reason` (text), `timestamp` (datetime — pode ser automático com campo created/updated nativo do PB, ou manter um campo explícito se você exigir).
  - Rules: admin vê tudo; usuário vê apenas os seus próprios logs (via `user`).

## Atualização do Script de Schema (Windows/PowerShell Friendly)
- Evoluir [setup_schema.js](file:///c:/Users/Fabio/Desktop/rastreador-de-vencimentos/scripts/setup_schema.js) para:
  - Detectar versão automaticamente (tentar `superusers/auth-with-password` e fazer fallback para `admins/auth-with-password`).
  - Inspecionar e imprimir schema atual + rules (diagnóstico profundo antes de CRUD).
  - Aplicar update via PATCH enviando o objeto completo da coleção (evita perda em PATCH).
  - Garantir relações com `maxSelect: 1` e `cascadeDelete: true`.
- Ao final da execução do script, gerar o relatório solicitado em tabela Markdown:
  - `| Coleção | Campos Criados | Status Rules | RBAC Ativo? | Impacto Performance (0-10) |`

## Autenticação do App com PocketBase (Tela de Login)
- Implementar autenticação do usuário final via endpoint do auth-collection:
  - `POST /api/collections/rastreador_de_vencimentos_usuarios/auth-with-password`.
- Persistência e restauração de sessão (baixo custo no servidor):
  - Armazenar `token` + `record` no `localStorage`.
  - No boot do app, tentar `auth-refresh` (quando disponível); se falhar, limpar sessão e ir para login.
- UX/UI “Premium, Minimalist, Data-First”:
  - Botão Entrar com estado `loading` + feedback claro.
  - Erros técnicos exatos (ex.: status code e mensagem normalizada), sem textos genéricos.
  - Skeletons onde houver carregamento real de dados.

## Dados (Cache Frontend + Queries Eficientes)
- Substituir `MOCK_BILLS` como fonte principal por sincronização com PocketBase:
  - Cache local (localStorage) com TTL curto + revalidação em background.
  - Evitar `expand` profundo (máx. 1 nível: `category`).
  - Filtrar por usuário no backend via rules; no client usar paginação e filtros por mês.
- UI otimista:
  - Criar/editar/deletar contas atualiza UI primeiro; em caso de falha, rollback e mensagem de erro precisa.

## Datas (Critical Fix)
- Ajustar parsing de `YYYY-MM-DD` no frontend para evitar bug de timezone:
  - Sempre usar `new Date(str.slice(0, 10) + 'T12:00:00')` ao converter.
  - Padronizar conversões em `FinanceService`, `CalendarLogic` e views.

## Testes de Regressão + Validação em Navegadores
- Adicionar testes no mesmo estilo dos atuais `*.test.ts` (runner simples):
  - Login: sucesso/erro (simulando respostas via mock de `fetch`).
  - Persistência: token/rota no `localStorage` e restauração após reload.
  - Datas: garantir que `YYYY-MM-DD` não “volta um dia” em diferentes timezones.
- Checklist de validação manual multi-browser (Chrome/Edge/Firefox):
  - Login → reload na rota atual → permanece.
  - Token expirado → redireciona para login.
  - Rede lenta → skeletons e UI não trava.

## Entregáveis
- Script de schema atualizado e executável via Node.
- Coleções e rules alinhadas ao `types.ts`.
- Tela de autenticação funcionando com PocketBase (sessão persistente e refresh).
- Relatório final em tabela Markdown após aplicação do schema.

Se você confirmar este plano, eu começo pela inspeção do schema atual via script Node e, em seguida, aplico o update/creation das coleções e integro a tela de login com o PocketBase.