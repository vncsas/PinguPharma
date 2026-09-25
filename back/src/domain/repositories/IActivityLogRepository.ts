import type { ActivityLog } from "../entities/ActivityLog.js";

export interface CreateActivityLogData {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export interface ListActivityLogsQuery {
  entity?: string;
  action?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export interface PaginatedActivityLogs {
  data: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IActivityLogRepository {
  create(data: CreateActivityLogData): Promise<ActivityLog>;
  list(query: ListActivityLogsQuery): Promise<PaginatedActivityLogs>;
  distinctEntities(): Promise<string[]>;
  distinctActions(): Promise<string[]>;
}
