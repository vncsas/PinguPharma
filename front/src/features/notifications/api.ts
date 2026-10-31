import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export type NotificationType =
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "LOW_STOCK"
  | "STOCK_CRITICAL"
  | "TRANSFER_PENDING"
  | "TRANSFER_UPDATE"
  | "SECURITY"
  | "SYSTEM";

export const NOTIFICATION_TYPES: NotificationType[] = [
  "EXPIRING_SOON",
  "EXPIRED",
  "LOW_STOCK",
  "STOCK_CRITICAL",
  "TRANSFER_PENDING",
  "TRANSFER_UPDATE",
  "SECURITY",
  "SYSTEM",
];

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  EXPIRING_SOON: "Vencendo em breve",
  EXPIRED: "Vencidos",
  LOW_STOCK: "Estoque baixo",
  STOCK_CRITICAL: "Estoque crítico",
  TRANSFER_PENDING: "Transferência pendente",
  TRANSFER_UPDATE: "Atualização de transferência",
  SECURITY: "Segurança",
  SYSTEM: "Sistema",
};

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  items: NotificationDTO[];
  total: number;
  unreadCount: number;
}

export interface NotificationPreferenceDTO {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
}

export interface ListNotificationsParams {
  unread?: boolean;
  page?: number;
  pageSize?: number;
}

export const notificationsApi = {
  list: (p: ListNotificationsParams = {}) => {
    const qs = new URLSearchParams();
    if (p.unread) qs.set("unread", "true");
    if (p.page) qs.set("page", String(p.page));
    if (p.pageSize) qs.set("pageSize", String(p.pageSize));
    const s = qs.toString();
    return apiFetch<NotificationsPage>(`/notifications${s ? `?${s}` : ""}`);
  },
  markRead: (id: string) => apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => apiFetch<{ updated: number }>("/notifications/read-all", { method: "POST" }),
  getPreferences: () => apiFetch<NotificationPreferenceDTO[]>("/notifications/preferences"),
  updatePreferences: (prefs: NotificationPreferenceDTO[]) =>
    apiFetch<NotificationPreferenceDTO[]>("/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(prefs),
    }),
};

const envPoll = Number(import.meta.env.VITE_NOTIFICATIONS_POLL_MS);
export const NOTIFICATIONS_POLL_MS = Number.isFinite(envPoll) && envPoll > 0 ? envPoll : 60_000;

export function useNotifications(params: ListNotificationsParams = {}, opts: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationsApi.list(params),
    refetchInterval: opts.poll ? NOTIFICATIONS_POLL_MS : false,
    placeholderData: (prev) => prev,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: notificationsApi.getPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.updatePreferences,
    onSuccess: (data) => qc.setQueryData(["notification-preferences"], data),
  });
}
