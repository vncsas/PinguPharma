export type NotificationType = "EXPIRING_SOON" | "EXPIRED" | "LOW_STOCK" | "SECURITY" | "SYSTEM"
  | "TRANSFER_PENDING"
  | "TRANSFER_UPDATE"
  | "STOCK_CRITICAL";

export const NOTIFICATION_TYPES: NotificationType[] = [
  "EXPIRING_SOON",
  "EXPIRED",
  "LOW_STOCK",
  "SECURITY",
  "SYSTEM",
  "TRANSFER_PENDING",
  "TRANSFER_UPDATE",
  "STOCK_CRITICAL",
];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  dedupeKey: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationPreference {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
}
