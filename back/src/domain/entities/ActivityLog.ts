export interface ActivityLog {
  id: string;
  userId: string | null;
  userName?: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}
