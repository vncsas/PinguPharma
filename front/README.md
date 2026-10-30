# PinguPharma · Front-end

Vite + React 18 + TypeScript, TanStack Query, React Router, react-hook-form + zod, Tailwind e um
design system próprio (Radix para os componentes de acessibilidade).

## Rodando

```powershell
cd front
cp .env.example .env     # VITE_API_URL=http://localhost:3333/api/v1
npm install
npm run dev              # http://localhost:5173 (o Vite faz proxy de /api para :3333)
```

O backend (`../back`) precisa estar no ar para login e dados.

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | typecheck + build de produção |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint (`no-explicit-any` é erro) |
| `npm test` / `npm run test:watch` | Vitest + Testing Library |
| `npm run format` | Prettier em `src/` |

O CI (`.github/workflows/ci.yml`) roda typecheck, lint, testes e build a cada push/PR.

## Estrutura

```
src/
  features/<domínio>/        auth, batches, customers, dashboard, products, reports, sales, users, audit
    api.ts                   cliente HTTP tipado + DTOs
    keys.ts                  query keys (factory)
    hooks.ts                 useQuery/useMutation do domínio (as páginas não chamam useQuery direto)
    schemas.ts               validação zod dos formulários
    constants.ts, utils.ts   labels, regras puras (testáveis)
    components/              pedaços de tela do domínio
    pages/                   telas (uma por rota)
  routes/
    config.tsx               ÚNICA fonte das rotas: path, página (lazy), roles e item de menu
    guards.tsx               RequireAuth e RequireRole
    AppRoutes.tsx            monta as <Route> a partir da config
  layouts/AppShell.tsx       sidebar + área da página (Suspense + error boundary)
  design-system/
    ui/                      Button, Input, Dialog, Toast, ConfirmDialog, EmptyState, ErrorState...
    layout/                  Sidebar, Topbar
  lib/
    api-client.ts            fetch com token, refresh único em 401, ApiError, download de arquivos
    auth-context.tsx         sessão do usuário
    forms.ts                 useZodForm e serverError
  test/app-harness.tsx       sobe o app inteiro com a API simulada (testes de fluxo)
```

## Convenções

**Rotas e permissões.** Para criar uma tela, adicione uma entrada em `routes/config.tsx` com `roles`
e, se for aparecer no menu, `nav`. O menu lateral e o bloqueio por papel leem a mesma config. O
backend continua sendo a barreira real; o front só evita mostrar o que o usuário não pode usar.

**Dados.** Cada domínio expõe hooks em `hooks.ts`. Mutations invalidam o cache sozinhas; o que mexe
em estoque (venda, cancelamento, lotes) usa `invalidateStock()` para atualizar produtos, lotes e
dashboard juntos. Chaves de query ficam em `keys.ts`, nunca como string solta na página.

**Formulários.** `useZodForm(schema)` + `register`. Mostre erro de campo no próprio `Input`
(`error={formState.errors.x?.message}`) e erro da API com `setError("root", serverError(err, "..."))`
e `<FormError message={formState.errors.root?.message} />`. Use `noValidate` no `<form>`.

**Feedback ao usuário.** `useToast()` para avisos, `useConfirm()` no lugar de `window.confirm`,
`Dialog` para modais, `EmptyState`/`ErrorState` para listas vazias ou com falha.

**Testes.** Regras puras (`cart.ts`, `utils.ts`, `schemas.ts`) têm testes unitários. Fluxos
completos (login, acesso por papel, venda no PDV) estão em `src/flows.test.tsx` usando
`mockApi`/`renderApp` do harness.

## Decisões a conhecer

- **Tokens em `localStorage`** (`pingu.access` / `pingu.refresh`). Simples, mas exposto a XSS. Migrar
  para cookie `httpOnly` exige mudança no backend; fica como evolução futura.
- **Refresh de token compartilhado:** várias requisições com 401 ao mesmo tempo disparam um único
  refresh, porque o refresh token é rotativo.
- **Páginas são `lazy`:** cada rota vira um chunk separado; o Recharts só carrega com Dashboard/Relatórios.

## Telas

`/login`, `/verificar-2fa`, `/esqueci-senha`, `/redefinir-senha` (públicas) · `/` Dashboard · `/pdv` ·
`/produtos` (+ `/novo`, `/:id/editar`) · `/estoque` · `/vendas` · `/clientes` · `/relatorios` ·
`/usuarios` · `/auditoria` · `/perfil`. Papéis: `ADMIN`, `MANAGER`, `SELLER` (veja `routes/config.tsx`).
