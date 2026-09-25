export interface ActivityContext {
  userId?: string | null;
  ipAddress?: string | null;
}

export interface IActivityLogger {
  log(
    ctx: ActivityContext,
    entry: {
      action: string;
      entity: string;
      entityId?: string | null;
      metadata?: Record<string, unknown> | null;
    },
  ): Promise<void>;
}
