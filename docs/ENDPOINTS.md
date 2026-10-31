# PinguPharma: Mapa de endpoints da API

Derivado de `back/src/interfaces/http/routes/*.ts`, `dtos/*.ts`, `unit-scope.ts`, `middlewares/auth.ts` e dos use cases citados. Quando um comportamento depende de regra de negócio, a fonte está no use case indicado.

## Convenções

| Item | Regra |
|------|-------|
| Base | `/api/v1`. Exceção: `GET /health` (fora do prefixo). |
| Autenticação | `Authorization: Bearer <accessToken>`. Rotas marcadas como "Público" não exigem token. |
| Validação de sessão | Em toda rota autenticada: assinatura do token, `status` ACTIVE e `tokenVersion` (`tv`) conferidos por `CachedSessionValidator` (cache de 30 s por usuário). |
| Escopo de unidade | Header `X-Unit-Id`, aceito apenas de ADMIN. Ver tabela abaixo. |
| Erros | Corpo `{ error, message, details? }`. |
| Paginação | `page` (mínimo 1) e `pageSize` (máximo 100; padrão 20, exceto auditoria com padrão 30). Listas paginadas devolvem `data`, `total`, `page`, `pageSize`. |
| Datas | ISO 8601 ou `YYYY-MM-DD`. |
| Booleanos em query | `"true"` ou `"false"`. |
| Auditoria | Ações de escrita relevantes gravam `ActivityLog` via `activityLogger.log`. Os códigos (ex.: `PRODUCT_CREATED`) aparecem na coluna de respostas quando a rota grava. |

### Escopo de unidade

| Quem | Leitura | Escrita |
|------|---------|---------|
| ADMIN com `X-Unit-Id` | Filtra pela unidade informada. | Usa a unidade informada. |
| ADMIN sem header | Todas as unidades. | Erro 400 `UNIT_REQUIRED`. |
| MANAGER, PHARMACIST, DISPENSER | Sempre a própria unidade (`user.unitId`). Header ignorado. | Sempre a própria unidade. |

Entidades globais, sem unidade: usuários, unidades, fornecedores, catálogo de produtos, pacientes e auditoria. Notificações são do próprio usuário.

### Erros comuns

| Status | `error` | Origem |
|--------|---------|--------|
| 400 | `UNIT_REQUIRED` | Escrita de ADMIN sem `X-Unit-Id`. |
| 401 | `UNAUTHORIZED` | Token ausente ou inválido, sessão revogada (`Sessão inválida`/`Sessão expirada`), senha ou código incorreto. |
| 403 | `FORBIDDEN` | Papel não permitido na rota ou regra do use case (ex.: DISPENSER em controlado). |
| 404 | `NOT_FOUND` | Recurso inexistente ou de outra unidade (o escopo responde 404, não 403). |
| 409 | `CONFLICT` | Duplicidade (e-mail, SKU, CPF, CNS, CNPJ) ou transição inválida. |
| 422 | `VALIDATION_ERROR` | Erro de schema Zod (com `details`) ou regra de negócio via `ValidationError`. |
| 422 | `APP_ERROR` | Regras de negócio via `AppError(..., 422)` sem código próprio (ex.: unidade inativa). |
| 429 | (rate limit) | `@fastify/rate-limit`. Limite global de 100 req/min; limites específicos por rota abaixo. Contagem por IP, em memória. |
| 500 | `INTERNAL_ERROR` | Erro não tratado. |

### Matriz de papéis (resumo)

| Área | ADMIN | MANAGER | PHARMACIST | DISPENSER |
|------|-------|---------|------------|-----------|
| Login, perfil, 2FA, notificações próprias | Sim | Sim | Sim | Sim |
| Dashboard, dispensações (leitura e não controlado), pacientes, receitas (leitura) | Sim | Sim | Sim | Sim |
| Dispensar controlado | Sim | Sim | Sim | Não |
| Cancelar dispensação | Sim | Sim | Sim | Não |
| Criar receita | Sim | Sim | Sim | Não |
| Excluir paciente | Sim | Sim | Sim | Não |
| Produtos: leitura (API) | Sim | Sim | Sim | Sim |
| Produtos: criar/editar/excluir | Sim | Sim | Não | Não |
| Produtos controlados ou classe: criar/editar | Sim | Não | Não | Não |
| Estoque: lotes, movimentos, perdas, ajustes | Sim | Sim | Sim | Não |
| Transferências: leitura | Sim | Sim | Sim | Sim (própria unidade) |
| Transferências: criar, enviar, receber, recusar, cancelar | Sim | Sim | Sim | Não |
| Fornecedores | Sim | Sim | Não | Não |
| Relatórios e livro de controlados | Sim | Sim | Sim | Não |
| Unidades: leitura | Todas | Própria | Própria | Própria |
| Unidades: criar/editar | Sim | Não | Não | Não |
| Usuários, auditoria, disparo de alertas | Sim | Não | Não | Não |

Observação: a API não restringe `GET /products` nem as escritas de paciente e receita por papel além do descrito. O front restringe a navegação (ver `front/src/routes/AppRoutes.tsx`).

---

## Autenticação e perfil (`auth.routes.ts`, `password-reset.routes.ts`)

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| POST | `/auth/login` | Público. Rate limit: 10 req / 15 min. | Global | `{ email, password (mín. 6) }` | 200 `{ status: "AUTHENTICATED", user, tokens }`. 200 `{ status: "TWOFA_REQUIRED", challengeToken }` se 2FA ativo. 401 credenciais inválidas. 403 usuário não ativo. |
| POST | `/auth/refresh` | Público | Global | `{ refreshToken (mín. 10) }` | 200 `{ tokens }`. 401 usuário inválido ou versão de sessão divergente. |
| POST | `/auth/2fa/verify` | Público. Rate limit: 10 req / 15 min. | Global | `{ challengeToken (mín. 10), code (6 a 8) }` | 200 `{ status: "AUTHENTICATED", user, tokens }`. 401 código incorreto ou 2FA não habilitado. |
| POST | `/auth/2fa/setup` | Qualquer autenticado | Próprio usuário | `{ confirm: boolean, code? (6 a 8) }`. Com `confirm=false` gera o segredo; com `confirm=true` exige `code`. | 200 `{ status: "SETUP", setup }` ou `{ status: "CONFIRMED" }`. 422 código incorreto ou setup não iniciado. Grava `TWOFA_ENABLED`. |
| DELETE | `/auth/2fa` | Qualquer autenticado | Próprio usuário | `{ password }` | 200 `{ status: "DISABLED" }`. 401 senha incorreta. Grava `TWOFA_DISABLED`. |
| GET | `/auth/me` | Qualquer autenticado | Próprio usuário | n/a | 200 `{ user }` (sem `passwordHash` e sem `twoFactorSecret`). 404. |
| PUT | `/auth/me` | Qualquer autenticado | Próprio usuário | `{ name? (2 a 120), email? }` | 200 `{ user }`. 409 e-mail já cadastrado. Grava `PROFILE_UPDATED`. |
| POST | `/auth/change-password` | Qualquer autenticado | Próprio usuário | `{ currentPassword, newPassword (8 a 128) }` | 200 `{ tokens }` novos (sessões antigas invalidadas). 401 senha atual incorreta. 422 nova senha fora do limite. Grava `PASSWORD_CHANGED`. |
| POST | `/auth/password-reset/request` | Público. Rate limit: 5 req / 15 min. | Global | `{ email }` | 200 `{ sent: true, devToken? }`. Resposta igual para e-mail inexistente. `devToken` só com `NODE_ENV=development` e `EXPOSE_DEV_RESET_TOKEN=true`. |
| POST | `/auth/password-reset/confirm` | Público. Rate limit: 5 req / 15 min. | Global | `{ token (10 a 2048), password (8 a 128) }` | 204. 401 token inválido ou expirado (ou versão de sessão divergente). 422 senha curta. Grava `PASSWORD_RESET_CONFIRMED`. |

## Catálogo de produtos (`products.routes.ts`)

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/products` | Qualquer autenticado | Catálogo global. Lotes e estoque filtrados pela unidade do escopo. | Query: `search?`, `active?`, `lowStockOnly?`, `controlled?`, `page`, `pageSize`. | 200 paginado. |
| GET | `/products/:id` | Qualquer autenticado | Lotes filtrados pela unidade do escopo. | n/a | 200 `{ product }`. 404. |
| POST | `/products` | ADMIN, MANAGER | Global | `{ name (2 a 120), sku (2 a 60), price (>= 0), minStockAlert? (int >= 0, padrão 0), controlledClass? (NONE, A1, A2, A3, B1, B2, C1 a C5; padrão NONE), description?, activeIngredient?, presentation?, measureUnit?, manufacturer?, renameCode? }` | 201 `{ product }`. 403 MANAGER cadastrando controlado. 409 SKU duplicado. Grava `PRODUCT_CREATED` e, se controlado, `PRODUCT_CONTROLLED_CLASS_CHANGED`. |
| PUT | `/products/:id` | ADMIN, MANAGER | Global | Campos parciais do POST, mais `active?`. | 200 `{ product }`. 403 MANAGER alterando controlado ou classe. 404. 409 SKU duplicado. Grava `PRODUCT_UPDATED` e, se a classe mudou, `PRODUCT_CONTROLLED_CLASS_CHANGED`. |
| DELETE | `/products/:id` | ADMIN, MANAGER | Global | n/a | 204. 404. Grava `PRODUCT_DELETED`. |

## Dashboard (`dashboard.routes.ts`)

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/dashboard/metrics` | Qualquer autenticado | Unidade (leitura) | n/a | 200 `{ metrics }` (dispensações, estoque crítico, vencimentos, transferências pendentes). |

## Dispensações (`dispensations.routes.ts`)

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/dispensations` | Qualquer autenticado | Unidade (leitura) | Query: `status?` (COMPLETED, CANCELED), `from?`, `to?`, `userId?`, `patientId?`, `prescriptionId?`, `page`, `pageSize`. | 200 paginado. |
| GET | `/dispensations/:id` | Qualquer autenticado | Unidade | n/a | 200 `{ dispensation }` (CPF e CNS mascarados). 404. |
| POST | `/dispensations` | Qualquer autenticado. Regras por papel no use case. | Unidade (escrita) | `{ patientId?, prescriptionId?, items: [{ productId, quantity (int > 0, máx. 1.000.000) }] }`, com 1 a 100 itens. | 201 `{ dispensation }`. 400 `UNIT_REQUIRED`. 403 DISPENSER com controlado. 422 paciente ou unidade inativos; controlado sem paciente ou receita; receita de outro paciente, de outra unidade ou vencida; controlado repetido no pedido. 409 receita já usada para o controlado. 404 produto, paciente ou receita. Baixa FEFO por lote. Grava `DISPENSATION_CREATED`. |
| POST | `/dispensations/:id/cancel` | ADMIN, MANAGER, PHARMACIST | Unidade | `{ reason (3 a 300) }` | 200 `{ dispensation }` com `status` CANCELED. Devolve o saldo aos lotes (movimento `DISPENSATION_CANCEL`). 409 já cancelada. 404. Notifica gestores e farmacêuticos. Grava `DISPENSATION_CANCELED`. |
| GET | `/dispensations/:id/receipt` | Qualquer autenticado | Unidade | n/a | 200 `text/html` (comprovante de dispensação, com CPF e CNS mascarados). 404. |

## Pacientes (`patients.routes.ts`)

Cadastro global: o modelo `Patient` não tem `unitId`. Ver dívida na seção de Fase 2 do plano.

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/patients` | Qualquer autenticado | Global | Query: `search?`, `active?`, `page`, `pageSize`. Para não ADMIN, busca por documento só com valor exato. | 200 paginado com CPF e CNS mascarados. |
| GET | `/patients/:id` | Qualquer autenticado | Global | n/a | 200 `{ patient }`. CPF e CNS vêm sem máscara. Grava `PATIENT_VIEWED`. 404. |
| POST | `/patients` | Qualquer autenticado | Global | `{ name (2 a 120), cpf?, cns?, birthDate?, phone?, email?, address?, notes?, active? }`. Exige CPF ou CNS, com dígitos verificadores. | 201 `{ patient }` (sem máscara). 409 CPF ou CNS já cadastrado. 422 CPF ou CNS inválido ou ausente. Grava `PATIENT_CREATED`. |
| PUT | `/patients/:id` | Qualquer autenticado | Global | Campos parciais do POST. | 200 `{ patient }` (sem máscara). 404. 409. 422. Grava `PATIENT_UPDATED`. |
| DELETE | `/patients/:id` | ADMIN, MANAGER, PHARMACIST | Global | n/a | 204. 409 se houver dispensações ou receitas (orienta inativar). 404. Grava `PATIENT_DELETED`. |

## Receitas (`prescriptions.routes.ts`)

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/prescriptions` | Qualquer autenticado | Unidade (leitura) | Query: `patientId?`, `validOnly?`, `page`, `pageSize`. | 200 paginado. |
| GET | `/prescriptions/:id` | Qualquer autenticado | Unidade | n/a | 200 `{ prescription }`. 404 (inexistente ou de outra unidade). |
| POST | `/prescriptions` | ADMIN, MANAGER, PHARMACIST | Unidade (escrita) | `{ patientId, prescriberName (2 a 120), prescriberCouncil (CRM, CRO, COREN, OTHER), prescriberCouncilNumber (1 a 30), number? (máx. 40), issuedAt, validUntil, retained?, notes? (máx. 1000) }` | 201 `{ prescription }`. 400 `UNIT_REQUIRED`. 404 paciente. 422 paciente ou unidade inativos; validade anterior à emissão. Grava `PRESCRIPTION_CREATED`. |

## Unidades (`units.routes.ts`)

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/units` | Qualquer autenticado | ADMIN: todas. Demais: somente a própria. | Query: `search?`, `activeOnly?`. | 200 `{ units }`. |
| POST | `/units` | ADMIN | Global | `{ name (2 a 120), cnes? (máx. 20), type (UBS, UPA, CENTRAL, HOSPITAL, OTHER), active? }` | 201 `{ unit }`. Grava `UNIT_CREATED`. |
| PUT | `/units/:id` | ADMIN | Global | Campos parciais do POST. | 200 `{ unit }`. 404. Grava `UNIT_UPDATED`. |

## Fornecedores (`suppliers.routes.ts`)

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/suppliers` | ADMIN, MANAGER | Global | Query: `search?`, `activeOnly?`. | 200 `{ suppliers }`. |
| POST | `/suppliers` | ADMIN, MANAGER | Global | `{ name (2 a 120), cnpj? (máx. 20; se informado, 14 dígitos), type (BIDDING, DONATION, MUNICIPAL_CENTRAL, OTHER), active? }` | 201 `{ supplier }`. 409 CNPJ já cadastrado. 422 CNPJ com dígitos diferentes de 14. Grava `SUPPLIER_CREATED`. |
| PUT | `/suppliers/:id` | ADMIN, MANAGER | Global | Campos parciais do POST. | 200 `{ supplier }`. 404. 409. 422. Grava `SUPPLIER_UPDATED`. |

## Estoque (`stock.routes.ts`, `batches.routes.ts`)

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/stock-movements` | ADMIN, MANAGER, PHARMACIST | Unidade (leitura) | Query: `productId?`, `batchId?`, `type?` (ENTRY_PURCHASE, ENTRY_DONATION, ENTRY_TRANSFER, DISPENSATION, DISPENSATION_CANCEL, LOSS_EXPIRED, LOSS_DAMAGE, ADJUSTMENT, TRANSFER_OUT), `from?`, `to?`, `page`, `pageSize`. | 200 paginado, com saldo corrente (`balance`) do produto. |
| POST | `/stock/losses` | ADMIN, MANAGER, PHARMACIST | Unidade (escrita) | `{ batchId, quantity (int > 0), type (LOSS_EXPIRED, LOSS_DAMAGE), reason (3 a 300), document? (máx. 60) }` | 201 `{ movement }`. 400 `UNIT_REQUIRED`. 404 lote inexistente ou de outra unidade. Grava `STOCK_LOSS`. |
| POST | `/stock/adjustments` | ADMIN, MANAGER, PHARMACIST | Unidade (escrita) | `{ batchId, newQuantity (int >= 0), reason (3 a 300) }` | 201 `{ movement }`. 400 `UNIT_REQUIRED`. 404. Grava `STOCK_ADJUSTMENT`. |
| GET | `/batches` | ADMIN, MANAGER, PHARMACIST | Unidade (leitura) | Query: `productId?`, `expiringWithinDays?` (1 a 365), `page`, `pageSize`. | 200 paginado. |
| POST | `/batches` | ADMIN, MANAGER, PHARMACIST | Unidade (escrita) | `{ productId, lotNumber (1 a 60), quantity (int > 0), costPrice (>= 0), expiresAt (deve estar no futuro), entryType? (ENTRY_PURCHASE padrão, ENTRY_DONATION), supplierId?, document? (máx. 60) }` | 201 `{ batch }`. 400 `UNIT_REQUIRED`. 404 unidade, produto ou fornecedor. 422 validade no passado. Grava `STOCK_ENTRY`. |
| DELETE | `/batches/:id` | ADMIN, MANAGER, PHARMACIST | Unidade | n/a | 204. 409 lote com saldo (registrar perda ou ajuste antes). 404. Grava `BATCH_DELETED`. |

## Transferências (`transfers.routes.ts`)

Fluxo: a unidade destino solicita (REQUESTED). A origem envia (SENT, com baixa FEFO e movimento `TRANSFER_OUT`). O destino recebe (RECEIVED, cria lotes com movimento `ENTRY_TRANSFER`). Recusa e cancelamento têm regras por lado, verificadas no use case.

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/transfers` | Qualquer autenticado | Unidade envolvida (origem ou destino). ADMIN sem header: todas. | Query: `direction?` (in, out), `status?`, `page` (máx. 10000), `pageSize`. | 200 paginado. |
| GET | `/transfers/:id` | Qualquer autenticado | Somente quem envolve a transferência. ADMIN vê todas. | n/a | 200 `{ transfer }`. 404 se a unidade não estiver envolvida. |
| POST | `/transfers` | ADMIN, MANAGER, PHARMACIST | Destino = unidade do escopo (ADMIN envia `X-Unit-Id`) | `{ fromUnitId, notes? (máx. 500), items: [{ productId, quantity (int > 0) }] }`, com 1 a 100 itens. Itens repetidos são somados. | 201 `{ transfer }` com status REQUESTED. 400 `UNIT_REQUIRED`. 422 origem igual ao destino. 404 unidade ou produto inativo ou inexistente. Notifica a origem (`TRANSFER_PENDING`). |
| POST | `/transfers/:id/send` | ADMIN, MANAGER, PHARMACIST | Somente a origem (ADMIN também) | n/a | 200 `{ transfer }` com status SENT. 403 não é a origem. 409 não está REQUESTED. Baixa FEFO na origem. Notifica (`TRANSFER_UPDATE`). |
| POST | `/transfers/:id/receive` | ADMIN, MANAGER, PHARMACIST | Somente o destino (ADMIN também) | n/a | 200 com status RECEIVED. 403. 409 não está SENT. Cria lotes no destino. Notifica (`TRANSFER_UPDATE`). |
| POST | `/transfers/:id/reject` | ADMIN, MANAGER, PHARMACIST | REQUESTED: origem. SENT: destino. | `{ reason (3 a 500) }` | 200 com status REJECTED. 403. 409. 422 sem motivo. Notifica (`TRANSFER_UPDATE`). |
| POST | `/transfers/:id/cancel` | ADMIN, MANAGER, PHARMACIST | REQUESTED: destino (solicitante). SENT: origem. | `{ reason (3 a 500) }` | 200 com status CANCELED. 403. 409. 422 sem motivo. Notifica (`TRANSFER_UPDATE`). |

## Usuários (`users.routes.ts`)

Todas as rotas são somente ADMIN.

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/users` | ADMIN | Global | Query: `search?`, `role?`, `status?` (ACTIVE, INACTIVE, BLOCKED), `unitId?`. | 200 `{ users }`. |
| POST | `/users` | ADMIN | Global | `{ name (2 a 120), email, password (mín. 8), role (ADMIN, MANAGER, PHARMACIST, DISPENSER), status?, unitId? }` | 201 `{ user }`. 409 e-mail já cadastrado. 422 unidade obrigatória para papel diferente de ADMIN. 404 unidade. Grava `USER_CREATED`. |
| PUT | `/users/:id` | ADMIN | Global | Campos parciais. `unitId` aceita `null`. | 200 `{ user }`. 409. 422 unidade obrigatória para papel diferente de ADMIN. 404. Grava `USER_UPDATED`. |
| POST | `/users/:id/reset-password` | ADMIN | Global | `{ password (mín. 8) }` | 204. 404. Grava `PASSWORD_RESET`. |
| DELETE | `/users/:id` | ADMIN | Global | n/a | 204. 409 ao tentar excluir o próprio usuário. 404. Grava `USER_DELETED`. |

## Relatórios e livro de controlados (`reports.routes.ts`)

Papéis: ADMIN, MANAGER, PHARMACIST. Todas as exportações `.csv` gravam `REPORT_EXPORTED`.

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/reports/consumption` | ADMIN, MANAGER, PHARMACIST | Unidade | Query: `from` (obrigatório), `to` (obrigatório), `productId?`. Intervalo máximo de 366 dias. | 200 `{ rows }`. 422 data inválida, `from` posterior a `to` ou intervalo acima de 366 dias. |
| GET | `/reports/consumption.csv` | ADMIN, MANAGER, PHARMACIST | Unidade | Mesmos parâmetros | CSV `consumo.csv`. |
| GET | `/reports/stock-coverage` | ADMIN, MANAGER, PHARMACIST | Unidade | Query: `productId?` | 200 `{ rows }` (ruptura e cobertura em dias). |
| GET | `/reports/stock-coverage.csv` | ADMIN, MANAGER, PHARMACIST | Unidade | Query: `productId?` | CSV `cobertura-estoque.csv`. |
| GET | `/reports/losses` | ADMIN, MANAGER, PHARMACIST | Unidade | Query: `from?`, `to?` (padrão: últimos 30 dias), `productId?`. Mesmo limite de 366 dias. | 200 `{ report }`. |
| GET | `/reports/losses.csv` | ADMIN, MANAGER, PHARMACIST | Unidade | Mesmos parâmetros | CSV `perdas.csv`. |
| GET | `/reports/dispensations` | ADMIN, MANAGER, PHARMACIST | Unidade | Query: `from?`, `to?`, `productId?`, `groupBy?` (patient ou prescriber; padrão patient). | 200 `{ groupBy, rows }`. |
| GET | `/reports/dispensations.csv` | ADMIN, MANAGER, PHARMACIST | Unidade | Mesmos parâmetros | CSV `dispensacoes-por-paciente.csv` ou `dispensacoes-por-prescritor.csv`. |
| GET | `/controlled/ledger` | ADMIN, MANAGER, PHARMACIST | Unidade | Query: `productId` (obrigatório), `from?`, `to?` | 200 `{ ledger }` com movimentos, saldo corrente, paciente, receita, prescritor e farmacêutico. CPF e CNS mascarados. 404 produto. |
| GET | `/controlled/ledger.csv` | ADMIN, MANAGER, PHARMACIST | Unidade | Mesmos parâmetros | CSV `livro-controlados.csv`. |
| GET | `/controlled/balance` | ADMIN, MANAGER, PHARMACIST | Unidade | n/a | 200 `{ rows }` por produto controlado: total em lotes, total no livro, divergência e lotes. |
| GET | `/controlled/balance.csv` | ADMIN, MANAGER, PHARMACIST | Unidade | n/a | CSV `balanco-controlados.csv`. |

## Notificações (`notifications.routes.ts`)

Todas as rotas são do próprio usuário.

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/notifications` | Qualquer autenticado | Próprio usuário | Query: `unread?` (true, false, 1, 0), `page`, `pageSize`. | 200 paginado. |
| GET | `/notifications/preferences` | Qualquer autenticado | Próprio usuário | n/a | 200 com as preferências por tipo. |
| PUT | `/notifications/preferences` | Qualquer autenticado | Próprio usuário | Lista de 1 a 8 itens `{ type, inApp, email }`, sem tipos repetidos. | 200 com as preferências atualizadas. 422 tipos duplicados. |
| POST | `/notifications/read-all` | Qualquer autenticado | Próprio usuário | n/a | 200 (resultado do use case). |
| PATCH | `/notifications/:id/read` | Qualquer autenticado | Próprio usuário | n/a | 204. 404. |

## Alertas (`alerts.routes.ts`)

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| POST | `/alerts/expiration/run` | ADMIN | Todas as unidades ativas | n/a | 200 `{ summary }` com contagens por unidade e destinatários. Grava `ALERTS_TRIGGERED`. |

O mesmo use case roda diariamente pelo `DailyScheduler`, ligado por `ALERTS_SCHEDULE_ENABLED` (padrão ligado fora de `NODE_ENV=test`).

## Auditoria (`audit.routes.ts`)

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/audit-logs` | ADMIN | Global | Query: `entity?`, `action?`, `userId?`, `from?`, `to?` (ISO datetime), `page`, `pageSize` (padrão 30). | 200 paginado. |
| GET | `/audit-logs/facets` | ADMIN | Global | n/a | 200 com facetas para os filtros. |

## Sistema

| Método | Path | Roles | Escopo | Corpo / query | Respostas e erros |
|--------|------|-------|--------|---------------|-------------------|
| GET | `/health` | Público. Fora de `/api/v1`. | n/a | n/a | 200 `{ status: "ok", service: "pingupharma-api" }` |
