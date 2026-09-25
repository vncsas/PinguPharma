import { Bell, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Tab {
  key: string;
  label: string;
}

interface TopbarProps {
  title: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  actions?: React.ReactNode;
}

export function Topbar({ title, tabs, activeTab, onTabChange, actions }: TopbarProps) {
  const { user } = useAuth();
  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
            <input
              placeholder="Buscar..."
              className="h-9 w-64 rounded-lg pl-9 pr-3 bg-white border border-line-strong text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            />
          </div>
          <button className="relative grid size-9 place-items-center rounded-lg bg-white border border-line-strong text-ink-muted hover:text-ink">
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent-rose" />
          </button>
          <div className="flex items-center gap-2 pl-2">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-ink leading-tight">{user?.name}</p>
              <p className="text-[11px] text-ink-muted">{user?.role}</p>
            </div>
            <div className="size-9 rounded-full bg-ink text-white grid place-items-center text-[11px] font-semibold">
              {initials || "?"}
            </div>
          </div>
        </div>
      </div>

      {tabs && (
        <div className="flex items-center justify-between border-b border-line">
          <div className="flex gap-6">
            {tabs.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  onClick={() => onTabChange?.(t.key)}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    active ? "text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                  {active && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
          {actions && <div className="pb-2">{actions}</div>}
        </div>
      )}
    </div>
  );
}
