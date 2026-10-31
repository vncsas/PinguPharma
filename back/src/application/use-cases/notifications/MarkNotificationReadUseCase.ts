import type { INotificationRepository } from "../../../domain/repositories/INotificationRepository.js";
import { NotFoundError } from "../../../shared/errors/AppError.js";

export class MarkNotificationReadUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const ok = await this.notifications.markRead(id, userId);
    if (!ok) throw new NotFoundError("Notification");
  }
}
