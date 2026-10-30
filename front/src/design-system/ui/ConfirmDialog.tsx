import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  /** Usa o botão vermelho; indicado para ações destrutivas. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Substitui `window.confirm`: `if (await confirm({ title: "Excluir?" })) ...` */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    // Uma confirmação nova cancela a pendente, para a promise anterior nunca ficar sem resposta.
    resolver.current?.(false);
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Dialog title={options.title} description={options.description} onClose={() => settle(false)}>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => settle(false)}>
              Cancelar
            </Button>
            <Button variant={options.danger ? "danger" : "primary"} onClick={() => settle(true)}>
              {options.confirmLabel ?? "Confirmar"}
            </Button>
          </div>
        </Dialog>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
