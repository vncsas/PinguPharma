import type { AuditFilters } from "./api";

export const auditKeys = {
  all: ["audit"] as const,
  list: (filters: AuditFilters) => [...auditKeys.all, "list", filters] as const,
  facets: () => [...auditKeys.all, "facets"] as const,
};
