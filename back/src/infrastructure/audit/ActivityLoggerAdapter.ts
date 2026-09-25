import type { IActivityLogRepository } from "../../domain/repositories/IActivityLogRepository.js";
import type { ActivityContext, IActivityLogger } from "../../domain/services/IActivityLogger.js";
import { logger } from "../../shared/logger.js";

export class ActivityLoggerAdapter implements IActivityLogger {
  constructor(private readonly repo: IActivityLogRepository) {}

  async log(
    ctx: ActivityContext,
    entry: {
      action: string;
      entity: string;
      entityId?: string | null;
      metadata?: Record<string, unknown> | null;
    },
  ) {
    try {
      await this.repo.create({
        userId: ctx.userId ?? null,
        ipAddress: ctx.ipAddress ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata ?? null,
      });
    } catch (err) {
      logger.warn({ err, entry }, "activity log failed");
    }
  }
}
