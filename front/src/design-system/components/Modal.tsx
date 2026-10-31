import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// open é opcional (padrão true) para uso com renderização condicional + onClose.
export interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  open?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Modal({ title, description, onClose, open = true, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto card !p-0 focus:outline-none",
            className,
          )}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
            <Dialog.Close
              aria-label="Fechar"
              className="grid size-8 place-items-center rounded hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {description ? (
            <Dialog.Description className="px-6 pt-4 text-sm text-ink-muted">{description}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          <div className="p-6 space-y-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
