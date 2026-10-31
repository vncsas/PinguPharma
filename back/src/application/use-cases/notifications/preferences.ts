import { NOTIFICATION_TYPES } from "../../../domain/entities/Notification.js";
import type { NotificationPreference, NotificationType } from "../../../domain/entities/Notification.js";

export function resolvePreference(
  stored: NotificationPreference[],
  type: NotificationType,
): NotificationPreference {
  return stored.find((p) => p.type === type) ?? { type, inApp: true, email: true };
}

export function withDefaults(stored: NotificationPreference[]): NotificationPreference[] {
  return NOTIFICATION_TYPES.map((t) => resolvePreference(stored, t));
}
