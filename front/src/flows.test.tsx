import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  callsTo,
  emptyMetrics,
  makeUser,
  mockApi,
  renderApp,
  signInAs,
  type ApiRoutes,
} from "./test/app-harness";

const product = {
  id: "p1",
  name: "Dipirona 500mg",
  sku: "DIP-500",
  description: null,
  price: 12.5,
  minStockAlert: 5,
  active: true,
  createdAt: "",
  updatedAt: "",
  totalStock: 10,
  nearestExpiration: null,
  batchCount: 1,
};

// Aquece os módulos pesados (Recharts) para o primeiro teste não pagar o custo da transformação.
beforeAll(async () => {
  await import("@/features/dashboard/pages/Dashboard");
});

beforeEach(() => {
  localStorage.clear();
  // Recharts mede o container via ResizeObserver; o jsdom não tem.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe("fluxo: login", () => {
  it("entra com e-mail e senha e cai no painel", async () => {
    const user = makeUser("ADMIN");
    const api = mockApi({
      "POST /auth/login": () => ({
        status: "AUTHENTICATED",
        user,
        tokens: { accessToken: "a", refreshToken: "r" },
      }),
      "GET /dashboard/metrics": () => ({ metrics: emptyMetrics }),
    });
    renderApp("/login");

    await userEvent.type(await screen.findByLabelText("E-mail"), "fulano@pingu.com");
    await userEvent.type(screen.getByLabelText("Senha"), "segredo123");
    await userEvent.click(screen.getByRole("button", { name: /Entrar/ }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(callsTo(api, "POST /auth/login")).toHaveLength(1);
    expect(localStorage.getItem("pingu.access")).toBe("a");
  });

  it("sem sessão, uma tela protegida leva ao login", async () => {
    mockApi({});
    renderApp("/pdv");
    expect(await screen.findByLabelText("E-mail")).toBeInTheDocument();
  });
});

describe("fluxo: acesso por papel", () => {
  const routes = (role: "SELLER" | "ADMIN"): ApiRoutes => ({
    ...signInAs(makeUser(role)),
    "GET /users": () => ({ users: [] }),
  });

  it("vendedor que abre /usuarios vê acesso negado e nenhuma chamada à API de usuários", async () => {
    const api = mockApi(routes("SELLER"));
    renderApp("/usuarios");

    expect(await screen.findByText("Acesso negado")).toBeInTheDocument();
    expect(callsTo(api, "GET /users")).toHaveLength(0);
  });

  it("administrador abre /usuarios normalmente", async () => {
    mockApi(routes("ADMIN"));
    renderApp("/usuarios");

    expect(await screen.findByRole("heading", { name: "Usuários" })).toBeInTheDocument();
    expect(screen.queryByText("Acesso negado")).not.toBeInTheDocument();
  });

  it("o menu do vendedor só mostra Dashboard e PDV", async () => {
    mockApi({ ...routes("SELLER"), "GET /dashboard/metrics": () => ({ metrics: emptyMetrics }) });
    renderApp("/");

    await screen.findByRole("heading", { name: "Dashboard" });
    expect(screen.getByTitle("PDV")).toBeInTheDocument();
    expect(screen.queryByTitle("Usuários")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Produtos")).not.toBeInTheDocument();
  });
});

describe("fluxo: venda no PDV", () => {
  beforeEach(() => {
    vi.spyOn(window, "open").mockReturnValue(null);
    URL.createObjectURL = vi.fn(() => "blob:recibo");
    URL.revokeObjectURL = vi.fn();
  });

  it("adiciona produto, finaliza a venda e limpa o carrinho", async () => {
    const api = mockApi({
      ...signInAs(makeUser("SELLER")),
      "GET /products": () => ({ data: [product], total: 1, page: 1, pageSize: 8 }),
      "POST /sales": () => ({ sale: { id: "sale-0123456789" } }),
      "GET /sales/sale-0123456789/receipt": () => new Response("<html>cupom</html>"),
    });
    renderApp("/pdv");

    await userEvent.click(await screen.findByText("Dipirona 500mg"));
    await userEvent.click(screen.getByLabelText("Aumentar Dipirona 500mg"));

    const cart = screen.getByRole("heading", { name: "Carrinho" }).closest("div.card") as HTMLElement;
    expect(within(cart).getByText("2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Crédito" }));
    await userEvent.click(screen.getByRole("button", { name: "Finalizar venda" }));

    expect(await screen.findByText(/Venda #23456789 registrada/)).toBeInTheDocument();
    expect(screen.getByText("Nenhum item adicionado ainda.")).toBeInTheDocument();

    const [, init] = callsTo(api, "POST /sales")[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      paymentMethod: "CREDIT",
      customerId: null,
      items: [{ productId: "p1", quantity: 2 }],
    });
    await waitFor(() => expect(window.open).toHaveBeenCalled());
  });

  it("mostra o erro da API e mantém o carrinho quando a venda falha", async () => {
    mockApi({
      ...signInAs(makeUser("SELLER")),
      "GET /products": () => ({ data: [product], total: 1, page: 1, pageSize: 8 }),
      "POST /sales": () =>
        new Response(JSON.stringify({ error: "NO_STOCK", message: "Estoque insuficiente" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
    });
    renderApp("/pdv");

    await userEvent.click(await screen.findByText("Dipirona 500mg"));
    await userEvent.click(screen.getByRole("button", { name: "Finalizar venda" }));

    expect(await screen.findByText("Estoque insuficiente")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum item adicionado ainda.")).not.toBeInTheDocument();
  });
});
