import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type {
  CreateNotificationData,
  INotificationRepository,
  ListNotificationsQuery,
  PaginatedNotifications,
} from "../../../domain/repositories/INotificationRepository.js";
import type {
  Notification,
  NotificationPreference,
  NotificationType,
} from "../../../domain/entities/Notification.js";

function toNotification(row: Prisma.NotificationGetPayload<object>): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    link: row.link,
    dedupeKey: row.dedupeKey,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

function toPreference(row: Prisma.NotificationPreferenceGetPayload<object>): NotificationPreference {
  return { type: row.type as NotificationType, inApp: row.inApp, email: row.email };
}

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateNotificationData): Promise<Notification | null> {
    const dedupeKey = data.dedupeKey ?? null;
    if (dedupeKey) {
      const exists = await this.prisma.notification.findFirst({
        where: { userId: data.userId, dedupeKey },
        select: { id: true },
      });
      if (exists) return null;
    }
    try {
      const row = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          link: data.link ?? null,
          dedupeKey,
        },
      });
      return toNotification(row);
    } catch (err) {
      if (
        dedupeKey &&
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return null;
      }
      throw err;
    }
  }

  async listByUser(query: ListNotificationsQuery): Promise<PaginatedNotifications> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.NotificationWhereInput = {
      userId: query.userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { data: rows.map(toNotification), total, page, pageSize };
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(id: string, userId: string): Promise<boolean> {
    const found = await this.prisma.notification.count({ where: { id, userId } });
    if (!found) return false;
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return true;
  }

  async markAllRead(userId: string): Promise<number> {
    const r = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return r.count;
  }

  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    const rows = await this.prisma.notificationPreference.findMany({ where: { userId } });
    return rows.map(toPreference);
  }

  async upsertPreferences(
    userId: string,
    prefs: NotificationPreference[],
  ): Promise<NotificationPreference[]> {
    await this.prisma.$transaction(
      prefs.map((p) =>
        this.prisma.notificationPreference.upsert({
          where: { userId_type: { userId, type: p.type } },
          update: { inApp: p.inApp, email: p.email },
          create: { userId, type: p.type, inApp: p.inApp, email: p.email },
        }),
      ),
    );
    return this.getPreferences(userId);
  }
}
