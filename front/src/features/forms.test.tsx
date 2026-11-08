import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordCard } from "./auth/components/ChangePasswordCard";
import LoginPage from "./auth/pages/Login";
import { CustomerFormModal } from "./customers/components/CustomerFormModal";

const signIn = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: null, signIn }),
}));

const fetchMock = vi.fn();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  signIn.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("CustomerFormModal", () => {
  it("valida o nome e não chama a API enquanto inválido", async () => {
    wrap(<CustomerFormModal onClose={vi.fn()} onSuccess={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("Mínimo de 2 caracteres")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envia campos opcionais em branco como null", async () => {
    fetchMock.mockResolvedValue(json({ customer: { id: "c1" } }, 201));
    const onSuccess = vi.fn();
    wrap(<CustomerFormModal onClose={vi.fn()} onSuccess={onSuccess} />);

    await userEvent.type(screen.getAllByRole("textbox")[0], "Maria Souza");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      name: "Maria Souza",
      document: null,
      phone: null,
      email: null,
    });
  });

  it("mostra a mensagem de erro devolvida pela API", async () => {
    fetchMock.mockResolvedValue(json({ error: "CONFLICT", message: "Documento já cadastrado" }, 409));
    wrap(<CustomerFormModal onClose={vi.fn()} onSuccess={vi.fn()} />);

    await userEvent.type(screen.getAllByRole("textbox")[0], "Maria Souza");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Documento já cadastrado");
  });
});

describe("ChangePasswordCard", () => {
  it("bloqueia o envio quando a confirmação não coincide", async () => {
    wrap(<ChangePasswordCard />);
    const [current, next, confirm] = document.querySelectorAll<HTMLInputElement>("input[type=password]");

    await userEvent.type(current, "senhaantiga");
    await userEvent.type(next, "novasenha123");
    await userEvent.type(confirm, "diferente123");
    await userEvent.click(screen.getByRole("button", { name: "Trocar senha" }));

    expect(await screen.findByText("Senhas não coincidem")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("LoginPage", () => {
  it("mostra erros de validação sem chamar signIn", async () => {
    wrap(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: /Entrar/ }));

    expect(await screen.findByText("Informe o e-mail")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("exibe o erro do servidor quando o login falha", async () => {
    signIn.mockRejectedValue(new Error("Credenciais inválidas"));
    wrap(<LoginPage />);

    await userEvent.type(screen.getByLabelText("E-mail"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Senha"), "segredo123");
    await userEvent.click(screen.getByRole("button", { name: /Entrar/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciais inválidas");
    expect(signIn).toHaveBeenCalledWith("a@b.com", "segredo123");
  });
});
