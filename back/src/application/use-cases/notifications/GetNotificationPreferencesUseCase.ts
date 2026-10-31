import type { INotificationRepository } from "../../../domain/repositories/INotificationRepository.js";
import type { NotificationPreference } from "../../../domain/entities/Notification.js";
import { withDefaults } from "./preferences.js";

export class GetNotificationPreferencesUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(userId: string): Promise<NotificationPreference[]> {
    return withDefaults(await this.notifications.getPreferences(userId));
  }
}
