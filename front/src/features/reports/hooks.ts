import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";
import { reportKeys } from "./keys";

export function useFinancialReport(from: string, to: string) {
  return useQuery({
    queryKey: reportKeys.financial(from, to),
    queryFn: () => reportsApi.financial(from, to),
  });
}
