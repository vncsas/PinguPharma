import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi, type CustomerInput } from "./api";
import { customerKeys } from "./keys";

export function useCustomers(search?: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: customerKeys.list(search),
    queryFn: () => customersApi.list(search),
    ...options,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerInput) => customersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerInput }) =>
      customersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
