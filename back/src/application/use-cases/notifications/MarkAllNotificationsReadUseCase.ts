import type { INotificationRepository } from "../../../domain/repositories/INotificationRepository.js";

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(userId: string): Promise<{ updated: number }> {
    return { updated: await this.notifications.markAllRead(userId) };
  }
}
