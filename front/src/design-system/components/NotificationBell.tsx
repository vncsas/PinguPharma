import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string | Date;
  read: boolean;
  href?: string;
}

// count = não lidas (badge oculto se 0); viewAllHref = destino do link "Ver todas".
export interface NotificationBellProps {
  count: number;
  items: NotificationItem[];
  onItemClick?: (item: NotificationItem) => void;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
  viewAllHref?: string;
  className?: string;
}

function timeAgo(value: string | Date) {
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export function NotificationBell({
  count,
  items,
  onItemClick,
  onMarkAllRead,
  onViewAll,
  viewAllHref = "/notificacoes",
  className,
}: NotificationBellProps) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={count > 0 ? `Notificações, ${count} não lidas` : "Notificações"}
        className={cn(
          "relative grid size-10 place-items-center rounded-lg text-ink-muted hover:bg-surface-alt hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30",
          className,
        )}
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[16px] h-4 place-items-center rounded-full bg-accent-rose px-1 text-[10px] font-semibold leading-none text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          collisionPadding={8}
          className="z-50 w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-line bg-white/90 shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notificações</span>
            {onMarkAllRead && count > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="rounded text-xs font-medium text-brand-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">Nenhuma notificação.</p>
            ) : (
              items.map((item) => (
                <Dropdown.Item
                  key={item.id}
                  onSelect={() => onItemClick?.(item)}
                  className={cn(
                    "flex cursor-pointer gap-3 border-b border-line px-4 py-3 outline-none last:border-0 data-[highlighted]:bg-surface-alt",
                    !item.read && "bg-brand-50/60",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-brand-500")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">{item.title}</span>
                      <span className="shrink-0 text-[11px] text-ink-muted">{timeAgo(item.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-ink-muted">{item.body}</span>
                    {!item.read && <span className="sr-only">Não lida</span>}
                  </span>
                </Dropdown.Item>
              ))
            )}
          </div>
          <Dropdown.Item asChild>
            <a
              href={viewAllHref}
              onClick={(e) => {
                if (onViewAll) {
                  e.preventDefault();
                  onViewAll();
                }
              }}
              className="block border-t border-line px-4 py-2.5 text-center text-sm font-medium text-brand-500 outline-none data-[highlighted]:bg-surface-alt"
            >
              Ver todas
            </a>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
