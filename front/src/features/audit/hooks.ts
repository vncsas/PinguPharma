import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../alerts/api";
import { auditApi, type AuditFilters } from "./api";
import { auditKeys } from "./keys";

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({ queryKey: auditKeys.list(filters), queryFn: () => auditApi.list(filters) });
}

export function useAuditFacets() {
  return useQuery({ queryKey: auditKeys.facets(), queryFn: auditApi.facets });
}

export function useRunExpirationAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsApi.runExpiration,
    onSuccess: () => qc.invalidateQueries({ queryKey: auditKeys.all }),
  });
}
