import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { ConfirmProvider } from "@/design-system/ui/ConfirmDialog";
import { ToastProvider } from "@/design-system/ui/Toast";
import type { AuthUser, Role } from "@/features/auth/types";
import { tokenStore } from "@/lib/api-client";
import { AuthProvider } from "@/lib/auth-context";
import { AppRoutes } from "@/routes/AppRoutes";

type Handler = (req: { body: unknown; url: URL }) => unknown | Response;

/** Rotas da API simulada, no formato `"GET /products"` (sem o prefixo /api/v1). */
export type ApiRoutes = Record<string, Handler>;

export const makeUser = (role: Role, over: Partial<AuthUser> = {}): AuthUser => ({
  id: "u1",
  name: "Fulano de Tal",
  email: "fulano@pingu.com",
  role,
  status: "ACTIVE",
  twoFactorEnabled: false,
  ...over,
});

export const emptyMetrics = {
  today: { revenue: 0, salesCount: 0 },
  revenueLast7Days: [],
  latestSales: [],
  lowStockCount: 0,
  expiringSoonCount: 0,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Substitui `fetch` por um roteador em memória e devolve o mock para inspeção das chamadas. */
export function mockApi(routes: ApiRoutes) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const method = (init?.method ?? "GET").toUpperCase();
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const handler = routes[`${method} ${path}`];
    if (!handler) return json({ error: "NOT_MOCKED", message: `${method} ${path}` }, 404);
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    const result = handler({ body, url });
    return result instanceof Response ? result : json(result);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export const callsTo = (fetchMock: ReturnType<typeof mockApi>, route: string) =>
  fetchMock.mock.calls.filter(([input, init]) => {
    const path = new URL(String(input), "http://localhost").pathname.replace(/^\/api\/v1/, "");
    return `${(init?.method ?? "GET").toUpperCase()} ${path}` === route;
  });

/** Sessão já iniciada: grava tokens para o AuthProvider restaurar via GET /auth/me. */
export function signInAs(user: AuthUser) {
  tokenStore.set("access-token", "refresh-token");
  return { "GET /auth/me": () => ({ user }) } satisfies ApiRoutes;
}

export function renderApp(route: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
