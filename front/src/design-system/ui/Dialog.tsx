import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  title: string;
  description?: string;
  /** Chamado ao fechar por ESC, clique fora ou no botão X. */
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Modal controlado pelo pai: renderize-o condicionalmente (`{open && <Dialog ... />}`).
 * Foco preso, ESC e leitor de tela vêm do Radix.
 */
export function Dialog({ title, description, onClose, children, className }: DialogProps) {
  return (
    <RadixDialog.Root open onOpenChange={(open) => !open && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "card !p-0 overflow-hidden max-h-[90vh] flex flex-col focus:outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            className,
          )}
          // Sem descrição o Radix avisa no console; undefined declara isso de propósito.
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <div className="min-w-0">
              <RadixDialog.Title className="text-base font-semibold text-ink">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="text-xs text-ink-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              aria-label="Fechar"
              className="grid size-8 place-items-center rounded hover:bg-surface-alt"
            >
              <X className="size-4" />
            </RadixDialog.Close>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
