import type { INotificationRepository } from "../../../domain/repositories/INotificationRepository.js";
import type { NotificationPreference } from "../../../domain/entities/Notification.js";
import { withDefaults } from "./preferences.js";

export class UpdateNotificationPreferencesUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(userId: string, prefs: NotificationPreference[]): Promise<NotificationPreference[]> {
    return withDefaults(await this.notifications.upsertPreferences(userId, prefs));
  }
}
