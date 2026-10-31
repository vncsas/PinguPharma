# PinguPharma: Plano de Ação

> Documento de contexto para os subagentes (`pingu-db`, `pingu-api`, `pingu-front`, `pingu-ui`, `pingu-security`, `pingu-reviewer`). Leia antes de iniciar qualquer tarefa.

Estrutura do monorepo: `back/` (Fastify + Prisma + Zod) e `front/` (Vite + React 18 + TanStack Query). Os diretórios `api/` e `web/` citados em versões antigas do README não existem mais.

Mapa de endpoints: [docs/ENDPOINTS.md](ENDPOINTS.md).

**Status:** Fase 0 CONCLUÍDA. Fase 1 CONCLUÍDA. Fase 2 CONCLUÍDA, com exceções e dívidas listadas na seção 3.

---

## Índice

1. [Fase 0: Correções de segurança e dívidas (CONCLUÍDA)](#1-fase-0-correções-de-segurança-e-dívidas-concluída)
2. [Fase 1: Notificações e e-mails (CONCLUÍDA)](#2-fase-1-notificações-e-e-mails-concluída)
3. [Fase 2: Adaptação para farmácia pública (CONCLUÍDA)](#3-fase-2-adaptação-para-farmácia-pública-concluída)
4. [Decisões de arquitetura da Fase 2 (contrato único)](#4-decisões-de-arquitetura-da-fase-2-contrato-único)
5. [Roteiro de execução](#5-roteiro-de-execução)
6. [Convenções para subagentes](#6-convenções-para-subagentes)

---

## 1. Fase 0: Correções de segurança e dívidas (CONCLUÍDA)

Entregas verificadas no código:

| Item | Entrega |
|------|---------|
| Tokens de fluxo | Token de reset de senha com `type: "pwd-reset"`, separado do desafio 2FA (`"2fa-challenge"`, 5 min). Cada `verify` aceita apenas o seu tipo. |
| Token de reset em dev | `devToken` só é devolvido com `NODE_ENV=development` e `EXPOSE_DEV_RESET_TOKEN=true`. Padrão `false`. |
| RBAC no front | `Protected` aceita `roles` e bloqueia rotas por perfil (`AppRoutes.tsx`). |
| Alertas de estoque | Estoque baixo considera apenas produtos com `minStockAlert > 0`. |
| Escape HTML | E-mails usam `escapeHtml` (`shared/utils/escapeHtml.ts`). |
| Dependência morta | `@fastify/jwt` removida. O código usa `jsonwebtoken`. |

---

## 2. Fase 1: Notificações e e-mails (CONCLUÍDA)

Entregas verificadas no código:

| Área | Entrega |
|------|---------|
| Banco | Modelos `Notification` e `NotificationPreference`. `User.tokenVersion` (migração `user_token_version`). |
| Sessão | `tokenVersion` embutido nos tokens (`tv`). Troca de senha, reset e refresh incrementam/comparam a versão, invalidando refresh tokens antigos. `POST /auth/change-password` devolve `{ tokens }` novos. |
| 2FA | `DELETE /auth/2fa` exige `{ password }`. |
| E-mail | `MAIL_DRIVER=console\|smtp`. `SmtpMailer` (nodemailer) com variáveis `SMTP_*`, validadas em `config/env.ts` quando `MAIL_DRIVER=smtp`. Templates com escape HTML. |
| Notificações | `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`, `GET`/`PUT /notifications/preferences`. Cada usuário acessa só as próprias notificações. |
| Agendador | `DailyScheduler` roda `CheckExpirationAlerts` uma vez por dia, a partir de `ALERTS_RUN_HOUR` (padrão 7). Ligado por `ALERTS_SCHEDULE_ENABLED=true`. |
| Rate limit | Global de 100 req/min. Limite específico em login, 2FA verify e reset de senha. |
| Front | `ToastProvider`, `ConfirmDialog`, `Modal`, `NotificationBell` (sino funcional), `MobileNav` (menu mobile). `alert()`/`confirm()` nativos removidos dos fluxos. |

### Dívidas conhecidas

| # | Dívida | Impacto | Tratamento previsto |
|---|--------|---------|---------------------|
| 1 | Access token continua válido até 15 min (`JWT_ACCESS_TTL`) após troca de senha. | Janela curta em que um token antigo ainda acessa a API. Refresh já é invalidado. | Checar `tv` também no middleware de autenticação, ou aceitar e documentar. |
| 2 | E-mail diário sem dedupe persistido quando `inApp` está desligado. | O controle de "uma vez por dia" do `DailyScheduler` é em memória (`lastRunDay`). Reinício do processo pode reenviar o resumo no mesmo dia. | Persistir a última execução ou registrar envio por dia. |
| 3 | Erros de validação Zod respondem 422 (`interfaces/http/middlewares/error-handler.ts`). | Status pode não seguir a convenção esperada pelo front. | Revisar o status padrão e alinhar com `front/src/features/*/api.ts`. |

Atualização na Fase 2: a dívida 1 foi mitigada. O middleware agora confere `tv` e `status` em toda requisição autenticada, com cache de 30 s (ver 3.5, item 1). A dívida 3 segue aberta.

---

## 3. Fase 2: Adaptação para farmácia pública (CONCLUÍDA)

Alvo: UBS, UPA, centrais de abastecimento farmacêutico e farmácias municipais.

Escopo de verificação desta atualização: leitura do código em `back/src/interfaces/http`, `back/src/application/use-cases`, `back/prisma/schema.prisma`, `back/prisma/seed.ts`, `front/src/routes/AppRoutes.tsx` e `front/src/design-system/components/Sidebar.tsx`. Os itens marcados como "não verificado" dependem de execução (build, testes, banco real) ou de documentos fora do repositório.

### 3.1 Diferenças de domínio

| Hoje (farmácia privada) | Farmácia pública |
|-------------------------|------------------|
| Venda com pagamento | Não há venda nem pagamento. |
| Cliente (`Customer`) | Paciente (CNS/CPF). |
| Venda com cupom | Dispensação gratuita a paciente, mediante receita. |
| Estoque único | Estoque por unidade de saúde. |
| Entrada por compra | Entrada por licitação, doação ou transferência do almoxarifado central. |
| Sem controle especial | Controle de medicamentos controlados (Portaria SVS/MS 344/98). |
| Relatório financeiro | Relatórios de consumo, ruptura, perdas e vencidos. |
| Auditoria básica | Auditoria forte. |

### 3.2 Decisão de arquitetura

- Evoluir o sistema atual. Não criar fork.
- Renomeações de domínio: `Sale` → `Dispensation`, PDV → Dispensação, `Customer` → `Patient`.
- Remover pagamento e preço de venda da jornada. Manter custo/valor para prestação de contas.

### 3.3 Entregas por sub-etapa

| Etapa | Entregue (verificado no código) | Desvios e pendências |
|-------|---------------------------------|----------------------|
| **2.1** Unidades de saúde | Modelo `Unit` (name, cnes, type UBS, UPA, CENTRAL, HOSPITAL, OTHER, active). `User.unitId` (nulo só para ADMIN, validado no create e no update de usuário). `Batch.unitId` obrigatório. Escopo por `resolveUnitScope` e `requireUnitScope` (`interfaces/http/unit-scope.ts`); `X-Unit-Id` só para ADMIN. Filtro por unidade em estoque, dispensação, receita, transferência, relatórios e dashboard. Roles ADMIN, MANAGER, PHARMACIST, DISPENSER. CRUD de unidades em `/units` (ADMIN). Seed com 3 unidades. | Migration `20261030235900_fase2_saude_publica` preserva os dados: cria `unit_central`, atribui lotes, usuários não-ADMIN e dispensações a ela e converte SELLER para DISPENSER. Testada em cópia do `dev.db`. |
| **2.2** Paciente | Modelo `Patient` substitui `Customer`. CPF e CNS validados por dígito verificador (`shared/utils/documents.ts`). Exige CPF ou CNS. Unicidade com 409. Listagem mascara documentos. Para não ADMIN, busca por documento só com valor exato. `GET /patients/:id` registra `PATIENT_VIEWED`. Exclusão bloqueada se houver dispensação ou receita (orienta inativar). | Consentimento LGPD não modelado (sem campo no schema). `GET`, `POST` e `PUT` de paciente devolvem CPF e CNS sem máscara. Pacientes são globais (sem `unitId`). Escrita de paciente liberada a qualquer papel. |
| **2.3** Produto ampliado | `controlledClass` (NONE, A1, A2, A3, B1, B2, C1 a C5), `activeIngredient`, `presentation`, `measureUnit`, `manufacturer`, `renameCode` (código ATC na seed). Só ADMIN cria ou altera produto controlado ou sua classe (`CreateProductUseCase`, `UpdateProductUseCase`). | Não há flag `controlled` separada: controlado é `controlledClass` diferente de NONE. `price` segue como valor de referência. `GET /products` está aberto a qualquer papel na API (o front restringe a tela). |
| **2.4** Dispensação | `Dispensation` e `DispensationItem` (unitId, patientId?, userId, pharmacistId? só quando o ator é PHARMACIST, prescriptionId?, totalValue, status, cancelReason, canceledAt). Baixa FEFO por lote da unidade (`fefoBatches`). Controlado exige paciente, receita do mesmo paciente e unidade, receita não vencida, papel ADMIN, MANAGER ou PHARMACIST, e não reutilização da receita para o mesmo controlado (409). Cancelamento exige motivo, devolve o saldo aos lotes (`DISPENSATION_CANCEL`) e notifica gestores. Comprovante HTML em `GET /dispensations/:id/receipt`, com documentos mascarados. `Prescription` com conselho CRM, CRO, COREN ou OTHER, validade e retenção. | Limite de quantidade ou período por paciente NÃO aplicado. `dispensedQuantity` existe em `PrismaDispensationRepository`, mas nenhum use case o chama. Vínculo de farmacêutico responsável por unidade não modelado. |
| **2.5** Movimentações e transferências | `StockMovement` com ENTRY_PURCHASE, ENTRY_DONATION, ENTRY_TRANSFER, DISPENSATION, DISPENSATION_CANCEL, LOSS_EXPIRED, LOSS_DAMAGE, ADJUSTMENT e TRANSFER_OUT. Quantidade com sinal, motivo, documento e fornecedor. `Supplier` (BIDDING, DONATION, MUNICIPAL_CENTRAL, OTHER; CNPJ de 14 dígitos quando informado). `Transfer` com REQUESTED, SENT, RECEIVED, REJECTED e CANCELED, com regras por lado (origem envia, destino recebe). Envio dá baixa FEFO. Recebimento cria lotes no destino. | Tipo de entrada por transferência é `ENTRY_TRANSFER` (o plano dizia `TRANSFER_IN`). |
| **2.6** Controlados | `GET /controlled/ledger` (movimentos, dispensações com paciente, receita, prescritor e farmacêutico, e saldo corrente) e `GET /controlled/balance` (divergência = total em lotes menos total no livro). CSV dos dois. Acesso ADMIN, MANAGER e PHARMACIST. CPF e CNS mascarados no livro. | Não há farmacêutico responsável por unidade no modelo. Divergência não gera notificação (ver 2.8). Não há integração com SNGPC. Validação regulatória pendente (3.5). |
| **2.7** Relatórios públicos | `/reports/consumption`, `/reports/stock-coverage` (ruptura e cobertura em dias), `/reports/losses` e `/reports/dispensations` (groupBy patient ou prescriber). CSV em todos, com auditoria `REPORT_EXPORTED`. Dashboard por unidade (`/dashboard/metrics`). | Exportação em PDF não implementada (só CSV). `totalValue` segue nas dispensações e relatórios para prestação de contas. |
| **2.8** Notificações específicas | `CheckExpirationAlertsUseCase` roda por unidade e gera EXPIRED, EXPIRING_SOON (30 dias), LOW_STOCK e STOCK_CRITICAL (cobertura de até 7 dias ou ruptura com consumo). Destinatários: ADMIN (sempre) e MANAGER e PHARMACIST da unidade (`listRecipients`). Transferências geram TRANSFER_PENDING e TRANSFER_UPDATE. Cancelamento de dispensação gera aviso SYSTEM para gestores. | Divergência de controlado não gera notificação, embora o balanço a calcule. Dedupe de envio em memória (ver 3.5). |
| **2.9** Textos e UI | Telas renomeadas: `/dispensacao`, `/dispensacoes`, `/pacientes`, `/receitas`, `/estoque`, `/transferencias`, `/controlados`, `/fornecedores`, `/unidades`, `/relatorios`, `/notificacoes`, `/usuarios`, `/auditoria`. Busca em `front/src` por PDV, Cliente, Venda, Cupom e SELLER não retorna ocorrências. RBAC no front (`AppRoutes.tsx`) espelha os guards do back. | Textos de `Login.tsx` não foram revisados linha a linha nesta atualização. |

### 3.4 Decisões finais

- **Escopo de unidade.** ADMIN escolhe a unidade pelo header `X-Unit-Id`. Sem header, as leituras veem todas as unidades, e a escrita responde 400 `UNIT_REQUIRED`. Os demais papéis ficam presos à própria unidade, e o header é ignorado.
- **Controle de acesso em duas camadas.** O papel exigido fica na rota (`requireRole`). A regra de negócio fica no use case: controlado, lado da transferência e dono da receita.
- **Não encontrado fora da unidade retorna 404**, não 403, para não revelar a existência do registro.
- **Erros.** Validação Zod e regra de negócio retornam 422. Conflito retorna 409.
- **Pacientes** são cadastro global, sem `unitId`.
- **Sem pagamento.** `totalValue` existe só para prestação de contas.
- **Sessão.** `tokenVersion` e `status` são conferidos em toda requisição autenticada, com cache de 30 s. A escrita de usuário pelo repositório invalida o cache imediatamente.
- **Alertas.** Notificações deduplicadas por `dedupeKey` no formato `tipo:unidade:dia`. O agendador vem ligado por padrão fora de `NODE_ENV=test`.
- **Auditoria.** Escritas, visualização de paciente, exportação de relatório, disparo de alerta e mudanças de transferência gravam `ActivityLog`.

Conformidade regulatória (receitas, controlados, Portaria 344 e livro de registro) depende da validação do farmacêutico responsável. Esta documentação não substitui essa validação.

### 3.5 Dívidas conhecidas

| # | Dívida | Impacto | Tratamento previsto |
|---|--------|---------|---------------------|
| 1 | Validação de sessão com cache de 30 s por usuário (`CachedSessionValidator`). A escrita pelo `PrismaUserRepository` invalida o cache no mesmo processo. A janela de 30 s vale para alterações feitas fora dele (outra instância ou SQL direto). | Janela curta para uma alteração externa valer. | Aceitar e documentar, ou invalidar em outros caminhos de escrita. |
| 2 | DISPENSER lê transferências da própria unidade (`GET /transfers` e `GET /transfers/:id`), mas não as cria nem altera. | Atendente vê logística de reposição. | Restringir leitura a MANAGER e PHARMACIST, ou aceitar e documentar. |
| 3 | Pacientes são globais. Qualquer autenticado lê, cria e edita paciente de outra unidade. `GET /patients/:id`, `POST` e `PUT` devolvem CPF e CNS sem máscara. | Exposição de dado de saúde (LGPD). | Vínculo paciente-unidade ou escopo por unidade, e máscara consistente nas respostas. |
| 4 | Dedupe diário do scheduler em memória (`DailyScheduler.lastRunDay`). Reinício no mesmo dia pode reexecutar o alerta. A dedupe in-app é persistida (`@@unique([userId, dedupeKey])`), mas o envio de e-mail não foi verificado contra essa chave. | E-mails repetidos após reinício. | Persistir a última execução e registrar o envio por destinatário e dia. |
| 5 | Limite de quantidade e período por paciente não aplicado. `dispensedQuantity` existe, sem uso. | Regra de prestação de contas incompleta. | Chamar `dispensedQuantity` na criação de dispensação, com parâmetros definidos pelo farmacêutico responsável. |
| 6 | Divergência de controlado sem notificação. | Alerta regulatório não chega ao gestor. | Gerar notificação quando `divergence` for diferente de zero. |
| 7 | Rate limit em memória (padrão do plugin), sem store compartilhado. | Em mais de uma instância, cada processo conta separado. | Store externo quando houver deploy com várias instâncias. |
| 8 | Chunk grande no front. Não medido nesta revisão. As rotas são importadas de forma estática em `AppRoutes.tsx`, sem `lazy`. `front/vite.config.ts` não tem `manualChunks` nem `chunkSizeWarningLimit`. | Bundle inicial grande. | Medir com `npm run build` e aplicar `React.lazy` por rota. |
| 9 | ESLint com `--legacy-peer-deps` no front. Não há ocorrência em `front/` (sem `.npmrc`, sem script de lint com essa flag). O `npm install` do ESLint no front só funcionou com `--legacy-peer-deps` (conflito de peers); o flag não está registrado em `.npmrc`. | Instalação depende do ambiente. | Confirmar no ambiente e documentar ou resolver a incompatibilidade de peers. |
| 10 | `GET /products` sem restrição de papel na API. | Atendente lê catálogo, incluindo controlados. | Restringir a rota, ou aceitar e documentar. |
| 11 | Cancelamento por ADMIN sem `X-Unit-Id` não compara a unidade (`CancelDispensationUseCase` só compara quando a unidade é informada). | ADMIN cancela dispensação de qualquer unidade sem indicar a unidade. | Exigir `X-Unit-Id` na escrita, como nas demais rotas. |
| 12 | Migrações SQL não estão versionadas. | Reproduzir o schema depende de `prisma migrate dev`. | Versionar migrações antes do primeiro deploy. |
| 13 | `back/.env.example` traz `SEED_ADMIN_PASSWORD="troque-antes-de-usar"` (20 caracteres). O seed só exige 8, então o valor de exemplo passa na validação. | Se copiado sem edição, todas as contas do seed usam essa senha. | Trocar o exemplo por placeholder claro e validar contra lista de senhas fracas. |
| 14 | Erro de validação Zod responde 422 (dívida 3 da Fase 1). | Ver seção 2. | Ver seção 2. |
| 15 | Conformidade regulatória (receitas, controlados, Portaria SVS/MS 344/98, livro e balanço). | Risco legal se usado sem validação. | Validação formal do farmacêutico responsável antes de uso real. |
| 16 | LGPD: dados de saúde (CPF, CNS, endereço, telefone). Consentimento não modelado. Política de retenção e anonimização não implementada. A exclusão de paciente só é possível sem dispensação ou receita. | Obrigações legais sem cobertura técnica completa. | Consentimento, política de retenção e registro de acesso revisados pelo responsável jurídico. |

### 3.6 Próximos passos sugeridos

Itens não iniciados. A ordem é uma sugestão.

1. **Testes automatizados.** Use cases com repositórios em memória (a arquitetura já permite). Testes de rota com `app.inject`. Cobrir FEFO, regras de controlado, transferências por lado e escopo de unidade.
2. **Correções antes de piloto.** Limite por paciente e período (3.5, item 5). Máscara de documentos em `GET`, `POST` e `PUT` de paciente (item 3). Senha de exemplo do seed (item 13). Notificação de divergência de controlado (item 6).
3. **Deploy e banco.** Trocar SQLite por Postgres (o schema hoje tem `provider = "sqlite"`). Versionar migrações SQL (item 12). Definir `JWT_SECRET` e SMTP reais.
4. **Backups** do banco e da trilha de auditoria.
5. **NFC-e e SNGPC**, se aplicáveis ao município. A avaliar com o farmacêutico responsável.
6. **Integração e-SUS APS e RNDS**, se aplicável.
7. **Importação de estoque por planilha**, com validação prévia e relatório de linhas rejeitadas.
8. **2FA obrigatório para PHARMACIST e ADMIN.** Hoje é opcional: `LoginUseCase` só exige o desafio quando `twoFactorEnabled` está ativo.
9. **Exportação em PDF** de relatórios e do comprovante de dispensação.
10. **Consentimento e política de retenção LGPD** (item 16).

---

## 4. Decisões de arquitetura da Fase 2 (contrato único)

Contrato de referência. Divergências do que foi implementado estão em 3.3 e 3.5.

- Roles: ADMIN (secretaria, vê todas as unidades), MANAGER (gestor da unidade), PHARMACIST (farmacêutico: dispensa controlados, valida receita, aprova transferência), DISPENSER (atendente; substitui SELLER; migração SQL converte SELLER→DISPENSER).
- Unit(id,name,cnes?,type UBS|UPA|CENTRAL|HOSPITAL|OTHER,active). User.unitId? (null só ADMIN). Batch.unitId obrigatório. Escopo: JWT carrega `unit`; ADMIN escolhe unidade via header X-Unit-Id (ausente = todas nas leituras; escrita exige unidade); demais usuários são forçados à própria unidade (header ignorado).
- Patient substitui Customer (tabela renomeada, dados preservados): name,cns?,cpf?(pelo menos um dos dois),birthDate?,phone?,email?,address?,notes?,active; validação de CPF e CNS (dígitos verificadores); listas mascaram CPF/CNS; GET por id registra PATIENT_VIEWED no ActivityLog (LGPD).
- Product ganha: controlledClass NONE|A1|A2|A3|B1|B2|C1|C2|C3|C4|C5, activeIngredient?, presentation?, measureUnit?, manufacturer?, renameCode?; `price` vira valor de referência (prestação de contas), não preço de venda.
- Dispensation/DispensationItem substituem Sale/SaleItem (tabelas renomeadas): unitId,patientId?,userId(dispensador),pharmacistId?,prescriptionId?,totalValue,status COMPLETED|CANCELED,cancelReason?,canceledAt?. Sem pagamento. Baixa FEFO por lote na unidade. Rotas /dispensations (substituem /sales; comprovante /dispensations/:id/receipt). Cancelar exige motivo e ADMIN/MANAGER/PHARMACIST. Dispensação de produto controlado exige prescriptionId válida (não vencida, do mesmo paciente) e role PHARMACIST/MANAGER/ADMIN.
- Prescription(id,patientId,unitId,prescriberName,prescriberCouncil CRM|CRO|COREN|OTHER,prescriberCouncilNumber,number?,issuedAt,validUntil,retained Boolean,notes?,createdBy). Rotas /prescriptions (GET lista/por paciente, POST, GET :id).
- Supplier(id,name,cnpj?,type BIDDING|DONATION|MUNICIPAL_CENTRAL|OTHER,active). Rotas /suppliers (ADMIN/MANAGER).
- StockMovement(id,unitId,productId,batchId?,type ENTRY_PURCHASE|ENTRY_DONATION|ENTRY_TRANSFER|DISPENSATION|DISPENSATION_CANCEL|LOSS_EXPIRED|LOSS_DAMAGE|ADJUSTMENT|TRANSFER_OUT,quantity signed Int,reason?,document? (nota/empenho),supplierId?,refType?,refId?,userId,createdAt). TODA alteração de estoque grava movimento na mesma transação. Rotas: GET /stock-movements (filtros unit/product/type/período), POST /batches (entrada com supplierId+document+tipo de entrada), POST /stock/losses (baixa por vencimento/avaria com motivo), POST /stock/adjustments (motivo obrigatório).
- Transfer(id,fromUnitId,toUnitId,status REQUESTED|SENT|RECEIVED|REJECTED|CANCELED,requestedBy,sentBy?,receivedBy?,notes?,createdAt,sentAt?,receivedAt?) + TransferItem(transferId,productId,quantity,batchId?,lotNumber?,expiresAt?,costPrice?). Fluxo: unidade destino solicita; origem envia (PHARMACIST/MANAGER; baixa FEFO → TRANSFER_OUT, guarda lotes enviados); destino recebe (cria lotes no destino → ENTRY_TRANSFER). Rotas /transfers (GET, POST, POST :id/send, :id/receive, :id/reject, :id/cancel). Gera notificações TRANSFER_PENDING/TRANSFER_UPDATE.
- Livro de controlados (sem tabela nova): GET /controlled/ledger?productId&from&to (movimentos + dispensações com paciente/receita + saldo corrente) e GET /controlled/balance (saldo por produto controlado e lote); CSV em .csv.
- Relatórios (substituem financeiro): /reports/consumption (por produto/unidade/período), /reports/stock-coverage (ruptura e cobertura em dias = estoque / consumo médio diário 30d), /reports/losses, /reports/dispensations; todos com .csv e filtro de unidade. Dashboard: métricas de dispensações, estoque crítico, vencimentos, transferências pendentes; sem financeiro de vendas.
- Notificações novas: tipos TRANSFER_PENDING, TRANSFER_UPDATE, STOCK_CRITICAL (cobertura ≤7 dias) além dos existentes; alertas agora por unidade (destinatários: ADMIN + MANAGER/PHARMACIST da unidade).
- Auditoria: todas as ações novas no ActivityLog (UNIT_*, PATIENT_*, DISPENSATION_*, PRESCRIPTION_CREATED, TRANSFER_*, STOCK_LOSS, STOCK_ADJUSTMENT, SUPPLIER_*).
- UI: PDV→"Dispensação", Clientes→"Pacientes", Vendas→"Dispensações", Estoque com movimentações, novas telas Unidades, Fornecedores, Receitas, Transferências, Controlados, Relatórios públicos; seletor de unidade no Topbar para ADMIN; textos em pt-BR sem jargão de varejo.

---

## 5. Roteiro de execução

### 5.1 Sequência

```
Fase 0 (CONCLUÍDA)
  → Fase 1 (CONCLUÍDA)
    → Fase 2 (CONCLUÍDA): 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 / 2.7 / 2.8 → 2.9
      → Próximos passos (3.6)
```

### 5.2 Gates de revisão

| Etapa | Reviewer | Security |
|-------|----------|----------|
| Fase 0 | Concluída | Concluída |
| Fase 1 | Concluída | Concluída |
| 2.1 | Sim | Sim |
| 2.2 | Sim | Sim |
| 2.3 | Sim | Não |
| 2.4 | Sim | Não |
| 2.5 | Sim | Não |
| 2.6 | Sim | Sim |
| 2.7 | Sim | Não |
| 2.8 | Sim | Não |
| 2.9 | Sim | Não |

Cada etapa fecha com `pingu-reviewer` (build e lint de `back` e `front`). A atualização desta versão do documento não verificou se os gates foram executados. Registrar os resultados antes de tratar a Fase 2 como auditada.

---

## 6. Convenções para subagentes

- Use cases nunca importam Prisma nem Fastify. Dependem apenas de interfaces em `domain/`.
- Injeção de dependência em `back/src/shared/container/container.ts`.
- Imports ESM com sufixo `.js` no back.
- DTOs Zod em `back/src/interfaces/http/dtos/`, espelhados em `front/src/features/*/api.ts`. Ao mudar um lado, verificar o outro.
- Textos de UI e mensagens em pt-BR.
- Sem commits pelos subagentes.
- Briefings curtos.
- Resposta final dos subagentes: resumo de até 15 linhas com arquivos alterados.
- Não registrar senhas, tokens ou segredos reais em documentação ou código.
