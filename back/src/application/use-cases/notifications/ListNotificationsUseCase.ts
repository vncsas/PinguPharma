import type { INotificationRepository } from "../../../domain/repositories/INotificationRepository.js";
import type { Notification } from "../../../domain/entities/Notification.js";

export interface NotificationItem {
  id: string;
  type: Notification["type"];
  title: string;
  body: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface ListNotificationsOutput {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
}

export class ListNotificationsUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(input: {
    userId: string;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<ListNotificationsOutput> {
    const [list, unreadCount] = await Promise.all([
      this.notifications.listByUser(input),
      this.notifications.countUnread(input.userId),
    ]);
    return {
      items: list.data.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      total: list.total,
      unreadCount,
    };
  }
}
