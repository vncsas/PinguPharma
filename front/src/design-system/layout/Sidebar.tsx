import { NavLink } from "react-router-dom";
import {
  Settings2,
  LogOut,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { navItemsFor } from "@/routes/config";

export function Sidebar() {
  const { user, signOut } = useAuth();
  const items = navItemsFor(user?.role);
  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-[68px] shrink-0 h-screen sticky top-0 bg-white border-r border-line py-4">
      <div className="flex justify-center pb-4 border-b border-line">
        <img
          src="/pingu.png"
          alt="PinguPharma"
          className="size-10 object-contain"
          style={{ mixBlendMode: "multiply", filter: "invert(1)" }}
        />
      </div>

      <div className="flex flex-col items-center gap-1 py-4">
        <RailIcon label="Buscar">
          <Search className="size-4" />
        </RailIcon>
        <RailIcon label="Alertas">
          <Bell className="size-4" />
        </RailIcon>
      </div>

      <div className="divider mx-3" />

      <nav className="flex-1 flex flex-col items-center gap-1 py-4 overflow-y-auto scrollbar-thin">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            title={label}
            className={({ isActive }) =>
              cn(
                "grid size-10 place-items-center rounded-lg transition-colors relative",
                isActive
                  ? "bg-brand-50 text-brand-600 after:absolute after:left-[-14px] after:top-2 after:h-6 after:w-[3px] after:rounded-r after:bg-brand-500"
                  : "text-ink-muted hover:bg-surface-alt hover:text-ink",
              )
            }
          >
            <Icon className="size-4" />
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-2 pt-4 border-t border-line">
        <NavLink
          to="/perfil"
          title="Perfil"
          className={({ isActive }) =>
            cn(
              "grid size-10 place-items-center rounded-lg",
              isActive ? "bg-brand-50 text-brand-600" : "text-ink-muted hover:bg-surface-alt hover:text-ink",
            )
          }
        >
          <Settings2 className="size-4" />
        </NavLink>
        <button
          title="Sair"
          onClick={signOut}
          className="grid size-10 place-items-center rounded-lg text-ink-muted hover:text-accent-rose hover:bg-surface-alt"
        >
          <LogOut className="size-4" />
        </button>
        <div className="size-9 rounded-full bg-ink text-white grid place-items-center text-[11px] font-semibold mt-1">
          {initials || "?"}
        </div>
      </div>
    </aside>
  );
}

function RailIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      title={label}
      className="grid size-10 place-items-center rounded-lg text-ink-muted hover:bg-surface-alt hover:text-ink"
    >
      {children}
    </button>
  );
}
