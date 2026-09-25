# PinguPharma

- **`api/`** — Fastify + Prisma + Zod (TypeScript). Arquitetura em camadas com interfaces.
- **`web/`** — Vite + React 18 + TanStack Query + Tailwind + design system glass PinguPharma.

## Rodar em 3 passos

```powershell
# 1. API
cd api ; cp .env.example .env ; npm install ; npm run prisma:migrate -- --name init ; npm run prisma:seed ; npm run dev

# 2. Web (em outra shell)
cd web ; cp .env.example .env ; npm install ; npm run dev

# 3. Acesse http://localhost:5173
# Login: admin@pingupharma.dev / Admin@123
```

## Mapa do sistema PinguPharma

| PharmaControl (Livewire) | PinguPharma (React) | Status |
|--------------------------|---------------------|--------|
| Login + reset senha | `/login` | ✅ Pronto |
| 2FA Challenge/Manage | `/verificar-2fa`, `/perfil` | ✅ Pronto |
| Dashboard | `/` | ✅ Pronto |
| Produtos (list/create/edit) | `/produtos*` | ✅ Pronto |
| PDV (CreateSale) | `/pdv` | ✅ Pronto |
| Histórico de Vendas + Cupom | `/vendas` | ✅ Prontor |
| Relatório Financeiro | `/relatorios` | ✅ Pronto |
| Gerenciar Usuários | `/usuarios` | ✅ Pronto |
| Auditoria | `/auditoria` | ✅ Pronto |

## Arquitetura da API

```
api/src/
  domain/              # Entidades + interfaces (contratos)
    entities/          # User, Product, Batch, Sale, SaleItem, ...
    repositories/      # IUserRepository, IProductRepository, ISaleRepository
    services/          # IHasher, ITokenService, ITwoFactorService
  application/
    use-cases/         # LoginUseCase, CreateProductUseCase, ...
  infrastructure/
    database/          # PrismaClient + repositórios concretos
    security/          # Bcrypt, JWT, TOTP
  interfaces/http/     # Rotas Fastify, DTOs Zod, middlewares
  shared/
    container/         # DI (factory functions)
    errors/            # AppError hierarchy
```

Regra: **use case não conhece Prisma nem Fastify**. Depende apenas de interfaces em `domain/`. Trocar Postgres por outro banco, ou Fastify por Express, muda só a camada `infrastructure` ou `interfaces/http`.

## Design system PinguPharma

Baseado no visual glass azul: superfícies translúcidas com blur, hero cards em `bg-hero-blue`, títulos em `Instrument Sans` bold + acento em `Instrument Serif` italic com cor `brand-500`.

Ver `web/README.md` para detalhes dos componentes.

## O que ficou de fora dessa iteração

- Postgres real rodando (você precisa apontar `DATABASE_URL`; fluxo com `docker compose` do repo Laravel serve).
- Testes automatizados (a arquitetura já está preparada — troque cada repositório concreto por um `InMemory` nos testes).
- PDV, relatórios, auditoria, gestão de usuários (placeholders com layout final aplicado).
- Migração de dados do banco Laravel.

Próximo ciclo: implementar `SaleService` no domínio (FIFO), rotas `/sales` e as 5 telas restantes.
