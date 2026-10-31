import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const toneStyle: Record<Tone, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: "text-accent-success" },
  error: { icon: XCircle, cls: "text-accent-rose" },
  info: { icon: Info, cls: "text-brand-500" },
};

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((tone: Tone, title: string, description?: string) => {
    setItems((prev) => [...prev, { id: ++seq, tone, title, description }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => push("success", t, d),
      error: (t, d) => push("error", t, d),
      info: (t, d) => push("info", t, d),
    }),
    [push],
  );

  const remove = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <ToastContext.Provider value={api}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000} label="Notificação">
        {children}
        {items.map((item) => {
          const { icon: Icon, cls } = toneStyle[item.tone];
          return (
            <ToastPrimitive.Root
              key={item.id}
              type={item.tone === "error" ? "foreground" : "background"}
              duration={item.tone === "error" ? 8000 : undefined}
              onOpenChange={(o) => !o && remove(item.id)}
              className="flex items-start gap-3 rounded-xl border border-line bg-white/80 p-4 shadow-lg backdrop-blur-md transition-opacity data-[state=closed]:opacity-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]"
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", cls)} aria-hidden />
              <div className="min-w-0 flex-1">
                <ToastPrimitive.Title className="text-sm font-semibold text-ink">{item.title}</ToastPrimitive.Title>
                {item.description && (
                  <ToastPrimitive.Description className="mt-0.5 text-sm text-ink-muted">
                    {item.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close
                aria-label="Fechar notificação"
                className="grid size-6 place-items-center rounded text-ink-muted hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
              >
                <X className="size-3.5" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport
          aria-live="polite"
          className="fixed bottom-0 right-0 z-[100] m-0 flex w-full max-w-sm list-none flex-col gap-2 p-4 outline-none"
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}
