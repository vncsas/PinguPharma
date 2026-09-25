import { apiFetch } from "@/lib/api-client";

export interface ActivityLogDTO {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditFilters {
  entity?: string;
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

function toQuery(f: AuditFilters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const auditApi = {
  list: (f: AuditFilters = {}) =>
    apiFetch<{ data: ActivityLogDTO[]; total: number; page: number; pageSize: number }>(
      `/audit-logs${toQuery(f)}`,
    ),
  facets: () => apiFetch<{ entities: string[]; actions: string[] }>(`/audit-logs/facets`),
};
