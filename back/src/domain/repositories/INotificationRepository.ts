import type {
  Notification,
  NotificationPreference,
  NotificationType,
} from "../entities/Notification.js";

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  dedupeKey?: string | null;
}

export interface ListNotificationsQuery {
  userId: string;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  pageSize: number;
}

export interface INotificationRepository {
  /** Idempotente por (userId, dedupeKey): retorna null se já existir. */
  create(data: CreateNotificationData): Promise<Notification | null>;
  listByUser(query: ListNotificationsQuery): Promise<PaginatedNotifications>;
  countUnread(userId: string): Promise<number>;
  /** Retorna false se a notificação não existe ou não pertence ao usuário. */
  markRead(id: string, userId: string): Promise<boolean>;
  markAllRead(userId: string): Promise<number>;
  getPreferences(userId: string): Promise<NotificationPreference[]>;
  upsertPreferences(userId: string, prefs: NotificationPreference[]): Promise<NotificationPreference[]>;
}
