import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUnit } from "@/lib/unit-context";
import { ROLE_LABEL } from "@/lib/roles";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/api";
import { NotificationBell } from "./NotificationBell";
import { MobileNav, MobileNavTrigger } from "./MobileNav";

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
  const { isAdmin, units, selectedUnitId, setSelectedUnitId, currentUnit } = useUnit();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const notifs = useNotifications({ page: 1, pageSize: 8 }, { poll: true });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <MobileNavTrigger onClick={() => setNavOpen(true)} />
          <MobileNav open={navOpen} onOpenChange={setNavOpen} />
          <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <label className="flex items-center gap-2 h-9 rounded-lg bg-white border border-line-strong px-2.5 text-sm">
              <Building2 className="size-4 text-ink-muted" />
              <span className="sr-only">Unidade</span>
              <select
                value={selectedUnitId ?? ""}
                onChange={(e) => setSelectedUnitId(e.target.value || null)}
                className="bg-transparent outline-none max-w-[180px] truncate text-ink"
              >
                <option value="">Todas as unidades</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {u.active ? "" : " (inativa)"}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            currentUnit && (
              <span className="hidden md:inline-flex items-center gap-1.5 h-9 rounded-lg bg-white border border-line-strong px-3 text-sm text-ink">
                <Building2 className="size-4 text-ink-muted" />
                {currentUnit.name}
              </span>
            )
          )}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
            <input
              placeholder="Buscar..."
              className="h-9 w-64 rounded-lg pl-9 pr-3 bg-white border border-line-strong text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            />
          </div>
          <NotificationBell
            count={notifs.data?.unreadCount ?? 0}
            items={(notifs.data?.items ?? []).map((n) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              createdAt: n.createdAt,
              read: !!n.readAt,
              href: n.link ?? undefined,
            }))}
            onItemClick={(item) => {
              if (!item.read) markRead.mutate(item.id);
              if (item.href) navigate(item.href);
            }}
            onMarkAllRead={() => markAll.mutate()}
            onViewAll={() => navigate("/notificacoes")}
            className="border border-line-strong bg-white"
          />
          <div className="flex items-center gap-2 pl-2">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-ink leading-tight">{user?.name}</p>
              <p className="text-[11px] text-ink-muted">{user ? ROLE_LABEL[user.role] : ""}</p>
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
