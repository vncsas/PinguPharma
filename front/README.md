# PinguPharma Web

Vite + React 18 + TS + TanStack Query + Tailwind + design system glass próprio.

## Setup

```powershell
cd web
cp .env.example .env
npm install
npm run dev
```

App abre em `http://localhost:5173`. O Vite proxya `/api` para `http://localhost:3333`.

## Design system PinguPharma
- Cores: paleta `brand.500` (#1E3AFF), `brand.900` (#0B1F5C), acentos `amber`, `teal`, `rose`.
- Tipografia: `Instrument Sans` (bold para displays) + `Instrument Serif` italic para acentos ("safer patients, simpler compliance." style).
- Superfícies: `glass`, `glass-strong`, `glass-deep`, `hero-blue` — todas com blur, sheen e sombra.
- Componentes: `Button`, `GlassCard`, `Input/Field/Label`, `Badge`, `StatCard`, `Sidebar`, `Topbar`, `Table*`, `Skeleton`.

## Estrutura

```
src/
  design-system/components/   → primitivos reutilizáveis (Glass, Button, Table...)
  features/<domain>/api.ts    → cliente HTTP tipado por domínio
  pages/                      → telas (rotas)
  routes/AppRoutes.tsx        → mapa de rotas + guard de auth
  lib/                        → api-client, tokens, query client, auth context
```

## Telas prontas
- **/login** — Split-screen com hero glass azul + formulário.
- **/verificar-2fa** — Desafio TOTP.
- **/** — Dashboard: 4 stat cards, gráfico Recharts, últimas vendas, alertas.
- **/produtos** — Listagem paginada, filtros, KPIs superiores.
- **/produtos/novo** e **/produtos/:id/editar** — Formulário completo com card lateral educativo.
- **/perfil** — Cadastro/desativação de MFA com QR Code.

## Próximas iterações
PDV, histórico de vendas, relatórios financeiros, gestão de usuários, auditoria.
