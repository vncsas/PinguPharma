# PinguPharma API

Fastify + Prisma + Zod. Camadas: `domain` (entidades + interfaces) → `application` (use cases) → `infrastructure` (Prisma + adapters) → `interfaces/http` (rotas + DTOs). DI resolvido em `shared/container`.

## Setup

```powershell
cd api
cp .env.example .env
npm install
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

API sobe em `http://localhost:3333`. Rotas versionadas em `/api/v1`.

## Contas seed
- `admin@pingupharma.dev` (ADMIN)
- `gerente@pingupharma.dev` (MANAGER)
- `vendedor@pingupharma.dev` (SELLER)
- Senha: `Admin@123`

## Endpoints principais
| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/login` | Login (retorna tokens ou desafio MFA) |
| POST | `/api/v1/auth/refresh` | Renovar tokens |
| POST | `/api/v1/auth/2fa/verify` | Confirmar código do desafio MFA |
| POST | `/api/v1/auth/2fa/setup` | Inicia/confirma cadastro MFA |
| DELETE | `/api/v1/auth/2fa` | Desabilita MFA |
| GET | `/api/v1/auth/me` | Retorna usuário logado |
| GET | `/api/v1/products` | Listagem paginada com filtros |
| POST | `/api/v1/products` | Cria produto (ADMIN/MANAGER) |
| PUT | `/api/v1/products/:id` | Atualiza produto |
| DELETE | `/api/v1/products/:id` | Remove produto |
| GET | `/api/v1/dashboard/metrics` | KPIs, série de 7 dias e últimas vendas |

## Arquitetura em uma linha
Route → DTO (Zod) → UseCase → Repository (interface) → Prisma adapter.
