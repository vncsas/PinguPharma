import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  CreateActivityLogData,
  IActivityLogRepository,
  ListActivityLogsQuery,
  PaginatedActivityLogs,
} from "../../../domain/repositories/IActivityLogRepository.js";
import type { ActivityLog } from "../../../domain/entities/ActivityLog.js";

function toDomain(row: Prisma.ActivityLogGetPayload<{ include: { user: { select: { name: true } } } }>): ActivityLog {
  let meta: Record<string, unknown> | null = null;
  if (row.metadata) {
    try {
      meta = JSON.parse(row.metadata);
    } catch {
      meta = { raw: row.metadata };
    }
  }
  return {
    id: row.id,
    userId: row.userId,
    userName: row.user?.name ?? null,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    metadata: meta,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  };
}

export class PrismaActivityLogRepository implements IActivityLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateActivityLogData): Promise<ActivityLog> {
    const created = await this.prisma.activityLog.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId ?? null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        ipAddress: data.ipAddress ?? null,
      },
      include: { user: { select: { name: true } } },
    });
    return toDomain(created);
  }

  async list(query: ListActivityLogsQuery): Promise<PaginatedActivityLogs> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;
    const where: Prisma.ActivityLogWhereInput = {
      AND: [
        query.entity ? { entity: query.entity } : {},
        query.action ? { action: query.action } : {},
        query.userId ? { userId: query.userId } : {},
        query.from || query.to
          ? {
              createdAt: {
                ...(query.from ? { gte: query.from } : {}),
                ...(query.to ? { lte: query.to } : {}),
              },
            }
          : {},
      ],
    };
    const [rows, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.activityLog.count({ where }),
    ]);
    return { data: rows.map(toDomain), total, page, pageSize };
  }

  async distinctEntities(): Promise<string[]> {
    const rows = await this.prisma.activityLog.findMany({
      distinct: ["entity"],
      select: { entity: true },
    });
    return rows.map((r) => r.entity).sort();
  }

  async distinctActions(): Promise<string[]> {
    const rows = await this.prisma.activityLog.findMany({
      distinct: ["action"],
      select: { action: true },
    });
    return rows.map((r) => r.action).sort();
  }
}
