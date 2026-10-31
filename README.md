# PinguPharma

Sistema de gestão de farmácia pública. Controla estoque por unidade de saúde (UBS, UPA, central de abastecimento), dispensação gratuita a pacientes mediante receita, medicamentos controlados (Portaria SVS/MS 344/98) e relatórios de consumo, ruptura, perdas e vencimentos.

> Projeto em desenvolvimento, rodando com SQLite e configuração de dev. A conformidade regulatória (receitas, controlados, livro e balanço) e a adequação à LGPD dependem de validação do farmacêutico responsável antes de qualquer uso real. Pendências em [docs/PLANO_DE_ACAO.md](docs/PLANO_DE_ACAO.md), seção 3.5.

## Stack

- **`back/`**: Fastify 4, Prisma 5 (SQLite em dev), Zod, TypeScript ESM. Porta 3333, prefixo `/api/v1`.
- **`front/`**: Vite, React 18, React Router 6, TanStack Query 5, Tailwind, Radix UI. Porta 5173, com proxy de `/api` para a API.
- **`docs/`**: mapa de endpoints e plano de ação.

## Como rodar

```
# 1. API
cd back
cp .env.example .env
# edite back/.env e defina SEED_ADMIN_PASSWORD (mínimo 8 caracteres). O seed não roda sem ele.
npm install
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev

# 2. Front (em outro terminal)
cd front
cp .env.example .env
npm install
npm run dev

# 3. Acesse http://localhost:5173
```

Variáveis de ambiente: [back/.env.example](back/.env.example) e [front/.env.example](front/.env.example). Em `NODE_ENV=production` a API recusa o `JWT_SECRET` do exemplo.

## Perfis (roles)

| Perfil | Quem é | O que pode fazer (resumo) |
|--------|--------|---------------------------|
| ADMIN | Secretaria de saúde | Vê todas as unidades. Gerencia unidades, usuários, auditoria e alertas. |
| MANAGER | Gestor da unidade | Produtos, estoque, fornecedores, transferências, relatórios, dispensa controlados e cancela dispensações. |
| PHARMACIST | Farmacêutico | Dispensa controlados, cria receitas, cancela dispensações, movimenta estoque e transferências. |
| DISPENSER | Atendente | Dispensa medicamentos não controlados, cadastra pacientes e consulta dispensações da unidade. |

A matriz completa por rota está em [docs/ENDPOINTS.md](docs/ENDPOINTS.md).

## Contas do seed

Criadas por [back/prisma/seed.ts](back/prisma/seed.ts). A senha é a mesma para todas e corresponde ao valor de `SEED_ADMIN_PASSWORD` no `back/.env`.

| E-mail | Perfil | Unidade |
|--------|--------|---------|
| `admin@pingupharma.dev` | ADMIN | Sem unidade fixa (vê todas) |
| `gerente.central@pingupharma.dev` | MANAGER | Central de Abastecimento Farmacêutico |
| `farmaceutico.central@pingupharma.dev` | PHARMACIST | Central de Abastecimento Farmacêutico |
| `atendente.central@pingupharma.dev` | DISPENSER | Central de Abastecimento Farmacêutico |
| `gerente.centro@pingupharma.dev` | MANAGER | UBS Centro |
| `farmaceutico.centro@pingupharma.dev` | PHARMACIST | UBS Centro |
| `atendente.centro@pingupharma.dev` | DISPENSER | UBS Centro |
| `gerente.jardim@pingupharma.dev` | MANAGER | UBS Jardim das Flores |
| `farmaceutico.jardim@pingupharma.dev` | PHARMACIST | UBS Jardim das Flores |
| `atendente.jardim@pingupharma.dev` | DISPENSER | UBS Jardim das Flores |

O seed é idempotente. Recria os dados transacionais dele (lotes, movimentos, dispensações, receitas, transferências e logs) e preserva o que foi cadastrado manualmente. Ele se recusa a rodar com `NODE_ENV=production`.

## Módulos e telas

| Rota | Tela | Acesso |
|------|------|--------|
| `/login`, `/verificar-2fa`, `/esqueci-senha`, `/redefinir-senha` | Autenticação e recuperação de senha | Público |
| `/` | Dashboard | Todos |
| `/dispensacao` | Dispensação | Todos |
| `/pacientes` | Pacientes | Todos |
| `/receitas` | Receitas | Todos |
| `/notificacoes` | Notificações | Todos |
| `/perfil` | Perfil | Todos |
| `/produtos`, `/produtos/novo`, `/produtos/:id/editar` | Produtos | Lista: ADMIN, MANAGER, PHARMACIST. Cadastro e edição: ADMIN, MANAGER |
| `/estoque` | Estoque | ADMIN, MANAGER, PHARMACIST |
| `/dispensacoes` | Histórico de dispensações | ADMIN, MANAGER, PHARMACIST |
| `/transferencias` | Transferências entre unidades | ADMIN, MANAGER, PHARMACIST |
| `/controlados` | Livro e balanço de controlados | ADMIN, MANAGER, PHARMACIST |
| `/relatorios` | Relatórios de consumo, ruptura, perdas e dispensações | ADMIN, MANAGER, PHARMACIST |
| `/fornecedores` | Fornecedores | ADMIN, MANAGER |
| `/unidades` | Unidades de saúde | ADMIN |
| `/usuarios` | Usuários | ADMIN |
| `/auditoria` | Auditoria | ADMIN |

O back aplica os mesmos papéis em cada rota. O front só esconde e bloqueia a navegação.

## Documentação

- [docs/ENDPOINTS.md](docs/ENDPOINTS.md): mapa completo de endpoints, papéis, escopo de unidade e erros.
- [docs/PLANO_DE_ACAO.md](docs/PLANO_DE_ACAO.md): fases concluídas, decisões, dívidas conhecidas e próximos passos.
- [back/README.md](back/README.md) e [front/README.md](front/README.md): detalhes de cada aplicação.

## Arquitetura

```
back/src/
  domain/              # Entidades e interfaces (contratos)
  application/         # Use cases (sem Prisma nem Fastify)
  infrastructure/      # Repositórios Prisma, segurança, e-mail, agendador
  interfaces/http/     # Rotas Fastify, DTOs Zod, middlewares, comprovante
  shared/              # Container de DI, erros (AppError), utilitários
```

Regra: use case não importa Prisma nem Fastify. Ele depende só de interfaces em `domain/`.

## Design system

Visual glass azul: superfícies translúcidas com blur, hero cards em `bg-hero-blue`, títulos em `Instrument Sans` com acento em `Instrument Serif` italic na cor `brand-500`. Detalhes dos componentes em [front/README.md](front/README.md).
