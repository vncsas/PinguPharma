import * as RadixToast from "@radix-ui/react-toast";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((tone: ToastTone, title: string, description?: string) => {
    setItems((prev) => [...prev, { id: nextId++, tone, title, description }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("error", title, description),
    }),
    [push],
  );

  const remove = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={api}>
      <RadixToast.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((t) => (
          <RadixToast.Root
            key={t.id}
            onOpenChange={(open) => !open && remove(t.id)}
            className={cn(
              "card flex items-start gap-3 p-4 data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            )}
          >
            {t.tone === "success" ? (
              <CheckCircle2 className="size-5 shrink-0 text-accent-success" />
            ) : (
              <CircleAlert className="size-5 shrink-0 text-accent-rose" />
            )}
            <div className="min-w-0 flex-1">
              <RadixToast.Title className="text-sm font-semibold text-ink">
                {t.title}
              </RadixToast.Title>
              {t.description && (
                <RadixToast.Description className="mt-0.5 text-xs text-ink-muted whitespace-pre-line">
                  {t.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close aria-label="Fechar" className="text-ink-muted hover:text-ink">
              <X className="size-4" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-[60] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
