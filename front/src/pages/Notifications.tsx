import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  ArrowLeftRight,
  Info,
  PackageMinus,
  PackageX,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Badge } from "@/design-system/components/Badge";
import { Skeleton } from "@/design-system/components/Skeleton";
import { useToast } from "@/design-system/components/Toast";
import {
  NOTIFICATION_TYPE_LABEL,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type NotificationDTO,
  type NotificationType,
} from "@/features/notifications/api";

const PAGE_SIZE = 20;

const TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; tone: "warn" | "danger" | "orange" | "brand" | "neutral" }
> = {
  EXPIRING_SOON: { icon: Clock, tone: "warn" },
  EXPIRED: { icon: AlertTriangle, tone: "danger" },
  LOW_STOCK: { icon: PackageMinus, tone: "orange" },
  STOCK_CRITICAL: { icon: PackageX, tone: "danger" },
  TRANSFER_PENDING: { icon: ArrowLeftRight, tone: "warn" },
  TRANSFER_UPDATE: { icon: ArrowLeftRight, tone: "brand" },
  SECURITY: { icon: ShieldAlert, tone: "brand" },
  SYSTEM: { icon: Info, tone: "neutral" },
};

export default function NotificationsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);

  const list = useNotifications({ unread: filter === "unread", page, pageSize: PAGE_SIZE });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const total = list.data?.total ?? 0;
  const unreadCount = list.data?.unreadCount ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function open(n: NotificationDTO) {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.link) nav(n.link);
  }

  function changeFilter(f: "all" | "unread") {
    setFilter(f);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <Topbar
        title="Notificações"
        tabs={[
          { key: "all", label: "Todas" },
          { key: "unread", label: unreadCount > 0 ? `Não lidas (${unreadCount})` : "Não lidas" },
        ]}
        activeTab={filter}
        onTabChange={(k) => changeFilter(k as "all" | "unread")}
        actions={
          <Button
            size="sm"
            variant="outline"
            disabled={unreadCount === 0 || markAll.isPending}
            onClick={() =>
              markAll.mutate(undefined, {
                onSuccess: (r) => toast.success("Notificações marcadas como lidas", `${r.updated} atualizada(s).`),
                onError: (e: Error) => toast.error("Falha ao marcar como lidas", e.message),
              })
            }
          >
            <CheckCheck className="size-4" /> Marcar todas como lidas
          </Button>
        }
      />

      <Card className="!p-0 overflow-hidden">
        {list.isLoading ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-4">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : list.isError ? (
          <div className="p-10 text-center text-sm text-accent-rose">
            Não foi possível carregar as notificações.{" "}
            <button className="underline" onClick={() => list.refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : (list.data?.items.length ?? 0) === 0 ? (
          <div className="grid place-items-center gap-2 p-12 text-center text-ink-muted">
            <Bell className="size-6" />
            <p className="text-sm">
              {filter === "unread" ? "Você não tem notificações não lidas." : "Nenhuma notificação por aqui."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {list.data!.items.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
              const Icon = meta.icon;
              const unread = !n.readAt;
              return (
                <li key={n.id} className={`flex items-start gap-3 p-4 ${unread ? "bg-brand-50/60" : ""}`}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white border border-line text-ink-muted">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm text-ink ${unread ? "font-semibold" : "font-medium"}`}>{n.title}</span>
                      <Badge tone={meta.tone}>{NOTIFICATION_TYPE_LABEL[n.type] ?? n.type}</Badge>
                      {unread && <Badge tone="solid">Nova</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
                    <p className="mt-1 text-[11px] text-ink-subtle">{new Date(n.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {n.link && (
                      <button onClick={() => open(n)} className="text-xs font-medium text-brand-500 hover:underline">
                        Abrir
                      </button>
                    )}
                    {unread && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        className="text-xs font-medium text-ink-muted hover:text-ink"
                      >
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>
            Página {page} de {pages} ({total} notificações)
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
