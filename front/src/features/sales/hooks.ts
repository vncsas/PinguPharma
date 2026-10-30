import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateStock } from "../invalidation";
import { salesApi, type CreateSalePayload, type SalesFilters } from "./api";
import { saleKeys } from "./keys";

export function useSales(filters: SalesFilters) {
  return useQuery({ queryKey: saleKeys.list(filters), queryFn: () => salesApi.list(filters) });
}

export function useSale(id: string | null) {
  return useQuery({
    queryKey: saleKeys.detail(id ?? ""),
    queryFn: () => salesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalePayload) => salesApi.create(payload),
    onSuccess: () =>
      Promise.all([qc.invalidateQueries({ queryKey: saleKeys.all }), invalidateStock(qc)]),
  });
}

export function useCancelSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.cancel(id),
    onSuccess: () =>
      Promise.all([qc.invalidateQueries({ queryKey: saleKeys.all }), invalidateStock(qc)]),
  });
}
