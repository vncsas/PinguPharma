import { apiFetch } from "@/lib/api-client";

export interface BatchDTO {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  lotNumber: string;
  quantity: number;
  costPrice: number;
  expiresAt: string;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchesResponse {
  data: BatchDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateBatchInput {
  productId: string;
  lotNumber: string;
  quantity: number;
  costPrice: number;
  expiresAt: string;
}

export interface BatchFilters {
  productId?: string;
  expiringWithinDays?: number;
  page?: number;
  pageSize?: number;
}

function toQuery(f: BatchFilters) {
  const p = new URLSearchParams();
  if (f.productId) p.set("productId", f.productId);
  if (f.expiringWithinDays !== undefined) p.set("expiringWithinDays", String(f.expiringWithinDays));
  if (f.page) p.set("page", String(f.page));
  if (f.pageSize) p.set("pageSize", String(f.pageSize));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const batchesApi = {
  list: (f: BatchFilters = {}) => apiFetch<BatchesResponse>(`/batches${toQuery(f)}`),
  create: (data: CreateBatchInput) =>
    apiFetch<{ batch: BatchDTO }>(`/batches`, { method: "POST", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/batches/${id}`, { method: "DELETE" }),
};
