import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser, Role } from "@/features/auth/types";
import { canAccess, navItemsFor, privateRoutes } from "./config";
import { RequireAuth, RequireRole } from "./guards";
import NotFoundPage from "@/pages/NotFound";

const auth = vi.hoisted(() => ({ value: { user: null as AuthUser | null, loading: false } }));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ ...auth.value, signOut: vi.fn() }),
}));

const userWith = (role: Role): AuthUser => ({
  id: "1",
  name: "Fulano de Tal",
  email: "f@t.com",
  role,
  status: "ACTIVE",
  twoFactorEnabled: false,
});

describe("config de rotas", () => {
  it("monta o menu conforme o role", () => {
    const paths = (r: Role) => navItemsFor(r).map((i) => i.to);

    expect(paths("SELLER")).toEqual(["/", "/pdv"]);
    expect(paths("MANAGER")).not.toContain("/usuarios");
    expect(paths("MANAGER")).toContain("/produtos");
    expect(paths("ADMIN")).toContain("/auditoria");
  });

  it("sem usuário não há itens de menu", () => {
    expect(navItemsFor(undefined)).toEqual([]);
  });

  it("canAccess libera rota sem restrição de roles", () => {
    expect(canAccess({}, undefined)).toBe(true);
    expect(canAccess({ roles: ["ADMIN"] }, "SELLER")).toBe(false);
  });

  it("não há paths duplicados", () => {
    const paths = privateRoutes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

function renderApp(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/login" element={<div>tela de login</div>} />
        <Route element={<RequireAuth />}>
          <Route
            path="/usuarios"
            element={
              <RequireRole roles={["ADMIN"]}>
                <div>tela de usuários</div>
              </RequireRole>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("guards", () => {
  beforeEach(() => {
    auth.value = { user: null, loading: false };
  });

  it("redireciona para o login sem usuário", () => {
    renderApp("/usuarios");
    expect(screen.getByText("tela de login")).toBeInTheDocument();
  });

  it("mostra carregando enquanto a sessão é restaurada", () => {
    auth.value = { user: null, loading: true };
    renderApp("/usuarios");
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("bloqueia role sem permissão", () => {
    auth.value = { user: userWith("SELLER"), loading: false };
    renderApp("/usuarios");
    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByText("tela de usuários")).not.toBeInTheDocument();
  });

  it("libera role permitido", () => {
    auth.value = { user: userWith("ADMIN"), loading: false };
    renderApp("/usuarios");
    expect(screen.getByText("tela de usuários")).toBeInTheDocument();
  });

  it("mostra 404 para rota desconhecida dentro do shell", () => {
    auth.value = { user: userWith("ADMIN"), loading: false };
    renderApp("/nada-aqui");
    expect(screen.getByText("Página não encontrada")).toBeInTheDocument();
  });
});
