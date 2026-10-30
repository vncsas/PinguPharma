import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./api";
import { dashboardKeys } from "./keys";

export function useDashboardMetrics() {
  return useQuery({ queryKey: dashboardKeys.metrics(), queryFn: dashboardApi.metrics });
}
