import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmProvider, useConfirm } from "./ConfirmDialog";
import { Dialog } from "./Dialog";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { ToastProvider, useToast } from "./Toast";

function ConfirmProbe({ onResult }: { onResult: (ok: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button
      onClick={async () =>
        onResult(await confirm({ title: "Excluir?", confirmLabel: "Excluir", danger: true }))
      }
    >
      abrir
    </button>
  );
}

describe("ConfirmProvider", () => {
  it("resolve true ao confirmar", async () => {
    const onResult = vi.fn();
    render(
      <ConfirmProvider>
        <ConfirmProbe onResult={onResult} />
      </ConfirmProvider>,
    );

    await userEvent.click(screen.getByText("abrir"));
    expect(screen.getByText("Excluir?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(onResult).toHaveBeenCalledWith(true);
    expect(screen.queryByText("Excluir?")).not.toBeInTheDocument();
  });

  it("resolve false ao cancelar e ao apertar ESC", async () => {
    const onResult = vi.fn();
    render(
      <ConfirmProvider>
        <ConfirmProbe onResult={onResult} />
      </ConfirmProvider>,
    );

    await userEvent.click(screen.getByText("abrir"));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onResult).toHaveBeenLastCalledWith(false);

    await userEvent.click(screen.getByText("abrir"));
    await userEvent.keyboard("{Escape}");
    expect(onResult).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenLastCalledWith(false);
  });
});

describe("Dialog", () => {
  it("chama onClose com ESC e pelo botão fechar", async () => {
    const onClose = vi.fn();
    render(
      <Dialog title="Novo item" onClose={onClose}>
        conteúdo
      </Dialog>,
    );

    expect(screen.getByRole("dialog", { name: "Novo item" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("fecha quando o pai deixa de renderizá-lo", async () => {
    function Host() {
      const [open, setOpen] = useState(true);
      return open ? (
        <Dialog title="Temp" onClose={() => setOpen(false)}>
          x
        </Dialog>
      ) : (
        <p>fechado</p>
      );
    }
    render(<Host />);
    await userEvent.keyboard("{Escape}");
    expect(screen.getByText("fechado")).toBeInTheDocument();
  });
});

describe("Toast", () => {
  it("exibe título e descrição", async () => {
    function Probe() {
      const toast = useToast();
      return <button onClick={() => toast.success("Salvo", "tudo certo")}>go</button>;
    }
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByText("go"));
    expect(await screen.findByText("Salvo")).toBeInTheDocument();
    expect(screen.getByText("tudo certo")).toBeInTheDocument();
  });
});

describe("EmptyState / ErrorState", () => {
  it("EmptyState mostra título e descrição", () => {
    render(<EmptyState title="Nada aqui" description="Cadastre o primeiro" />);
    expect(screen.getByText("Nada aqui")).toBeInTheDocument();
    expect(screen.getByText("Cadastre o primeiro")).toBeInTheDocument();
  });

  it("ErrorState mostra a mensagem do erro e dispara retry", async () => {
    const onRetry = vi.fn();
    render(<ErrorState error={new Error("API fora do ar")} onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("API fora do ar");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
