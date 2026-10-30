import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateStock } from "../invalidation";
import { batchesApi, type BatchFilters, type CreateBatchInput } from "./api";
import { batchKeys } from "./keys";

export function useBatches(filters: BatchFilters) {
  return useQuery({ queryKey: batchKeys.list(filters), queryFn: () => batchesApi.list(filters) });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBatchInput) => batchesApi.create(data),
    onSuccess: () => invalidateStock(qc),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batchesApi.remove(id),
    onSuccess: () => invalidateStock(qc),
  });
}
