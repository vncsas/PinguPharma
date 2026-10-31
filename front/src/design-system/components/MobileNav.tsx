import * as Dialog from "@radix-ui/react-dialog";
import { LogOut, Menu, Settings2, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { NAV } from "./Sidebar";

// Controlado: open/onOpenChange. Use <MobileNavTrigger onClick=.../> no Topbar (visível só < lg).
export interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNavTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abrir menu"
      className={cn(
        "grid size-10 place-items-center rounded-lg text-ink hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 lg:hidden",
        className,
      )}
    >
      <Menu className="size-5" />
    </button>
  );
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const { user, signOut } = useAuth();
  const role = user?.role ?? "DISPENSER";
  const items = NAV.filter((n) => (n.roles as readonly string[]).includes(role));
  const close = () => onOpenChange(false);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      isActive ? "bg-brand-50 text-brand-600" : "text-ink-muted hover:bg-surface-alt hover:text-ink",
    );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white py-4 shadow-xl focus:outline-none lg:hidden">
          <div className="flex items-center justify-between border-b border-line px-4 pb-4">
            <Dialog.Title className="font-bold text-ink">PinguPharma</Dialog.Title>
            <Dialog.Description className="sr-only">Menu de navegação</Dialog.Description>
            <Dialog.Close
              aria-label="Fechar menu"
              className="grid size-9 place-items-center rounded-lg hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <nav aria-label="Principal" className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === "/"} onClick={close} className={linkCls}>
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-1 border-t border-line px-3 pt-4">
            <NavLink to="/perfil" onClick={close} className={linkCls}>
              <Settings2 className="size-4" />
              Perfil
            </NavLink>
            <button
              type="button"
              onClick={() => {
                close();
                signOut();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-alt hover:text-accent-rose"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
