# PinguPharma API

API do sistema de gestão de farmácia pública. Fastify 4, Prisma 5 (SQLite em dev), Zod e TypeScript ESM. Porta `3333`, prefixo `/api/v1`. Healthcheck em `GET /health`, fora do prefixo.

Mapa completo de rotas, papéis, escopo de unidade e erros: [../docs/ENDPOINTS.md](../docs/ENDPOINTS.md).

## Setup

```
cd back
cp .env.example .env
# edite .env e defina SEED_ADMIN_PASSWORD (mínimo 8 caracteres). O seed não roda sem ele.
npm install
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

Variáveis de ambiente, com comentários: [.env.example](.env.example). A leitura e a validação estão em `src/config/env.ts`. Em `NODE_ENV=production` a API recusa o `JWT_SECRET` do exemplo. Com `MAIL_DRIVER=smtp`, são obrigatórios `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `MAIL_FROM`.

## Scripts

| Script | Comando |
|--------|---------|
| `npm run dev` | `tsx watch src/server.ts` |
| `npm run build` | `tsc -p tsconfig.json` |
| `npm start` | `node dist/server.js` (exige o `build` antes) |
| `npm run lint` | `eslint src --ext .ts` |
| `npm run prisma:generate` | `prisma generate` |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:seed` | `tsx prisma/seed.ts` |

Não há script de teste automatizado no `package.json`.

## Contas do seed

Criadas por [prisma/seed.ts](prisma/seed.ts). E-mails:

- `admin@pingupharma.dev` (ADMIN, sem unidade fixa)
- `gerente.<unidade>@pingupharma.dev` (MANAGER)
- `farmaceutico.<unidade>@pingupharma.dev` (PHARMACIST)
- `atendente.<unidade>@pingupharma.dev` (DISPENSER)

`<unidade>` é `central`, `centro` ou `jardim`. A senha de todas as contas é o valor de `SEED_ADMIN_PASSWORD` no `.env`. O código não tem senha padrão. Lista completa com unidades no [README raiz](../README.md#contas-do-seed).

## Autenticação e escopo

- Rotas autenticadas exigem `Authorization: Bearer <accessToken>`. A cada requisição são conferidos assinatura, `status` ACTIVE e `tokenVersion` (cache de 30 s por usuário).
- O papel exigido por rota é aplicado com `requireRole`. Regras de negócio adicionais ficam nos use cases.
- O escopo de unidade vem do usuário. ADMIN pode informar a unidade pelo header `X-Unit-Id`. Nas leituras, a ausência do header significa todas as unidades. Na escrita, a unidade é obrigatória (400 `UNIT_REQUIRED`). Os demais papéis usam sempre a própria unidade, e o header é ignorado.

### Limites de taxa

| Escopo | Limite |
|--------|--------|
| Global | 100 req / min |
| `POST /auth/login` | 10 / 15 min |
| `POST /auth/2fa/verify` | 10 / 15 min |
| `POST /auth/password-reset/request` e `/confirm` | 5 / 15 min |

Contagem por IP, em memória.

## Erros

Corpo `{ error, message, details? }`. Erros de validação Zod e regras de negócio com `ValidationError` retornam 422. Conflitos retornam 409. Não encontrado retorna 404. Um `AppError` de 422 sem código próprio sai como `APP_ERROR`. Lista completa em [../docs/ENDPOINTS.md](../docs/ENDPOINTS.md#erros-comuns).

## Módulos (rotas)

| Grupo | Prefixo |
|-------|---------|
| Autenticação, perfil, 2FA | `/auth` |
| Recuperação de senha | `/auth/password-reset` |
| Produtos | `/products` |
| Estoque e lotes | `/stock-movements`, `/stock`, `/batches` |
| Fornecedores | `/suppliers` |
| Unidades | `/units` |
| Pacientes | `/patients` |
| Receitas | `/prescriptions` |
| Dispensações | `/dispensations` |
| Transferências | `/transfers` |
| Controlados | `/controlled` |
| Relatórios | `/reports` |
| Dashboard | `/dashboard` |
| Notificações | `/notifications` |
| Alertas | `/alerts` |
| Usuários | `/users` |
| Auditoria | `/audit-logs` |

## Arquitetura

```
src/
  domain/              # Entidades, interfaces de repositórios e serviços
  application/
    use-cases/         # Regras de negócio, por módulo
  infrastructure/      # Repositórios Prisma, bcrypt, JWT, TOTP, e-mail, agendador
  interfaces/http/
    routes/            # Rotas Fastify
    dtos/              # Schemas Zod (corpo e query)
    middlewares/       # Autenticação, papéis, handler de erro
    unit-scope.ts      # Escopo de unidade (X-Unit-Id)
    views/receipt.ts   # Comprovante HTML de dispensação
  shared/
    container/         # Injeção de dependência manual
    errors/            # AppError e subclasses
    logger.ts
```

Fluxo: rota, DTO (Zod), use case, interface de repositório, adapter Prisma. Use case não importa Prisma nem Fastify.

Auditoria: ações de escrita relevantes chamam `activityLogger.log` e gravam em `ActivityLog`.

Alertas de vencimento e estoque rodam por `DailyScheduler` (ligado por `ALERTS_SCHEDULE_ENABLED`, padrão ligado fora de `NODE_ENV=test`) ou sob demanda por `POST /alerts/expiration/run`.

## Pendências

Dívidas conhecidas e próximos passos: [../docs/PLANO_DE_ACAO.md](../docs/PLANO_DE_ACAO.md), seção 3.5 e 3.6. Entre elas: limite de dispensação por paciente não aplicado, pacientes sem escopo de unidade e migrações SQL ainda não versionadas.
