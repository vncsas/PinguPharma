import { apiFetch } from "@/lib/api-client";

export interface ProductDTO {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  minStockAlert: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  totalStock: number;
  nearestExpiration: string | null;
  batchCount: number;
}

export interface ProductListResponse {
  data: ProductDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductFilters {
  search?: string;
  active?: boolean;
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProductInput {
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  minStockAlert: number;
}

function toQuery(filters: ProductFilters) {
  const p = new URLSearchParams();
  if (filters.search) p.set("search", filters.search);
  if (filters.active !== undefined) p.set("active", String(filters.active));
  if (filters.lowStockOnly) p.set("lowStockOnly", "true");
  if (filters.page) p.set("page", String(filters.page));
  if (filters.pageSize) p.set("pageSize", String(filters.pageSize));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    apiFetch<ProductListResponse>(`/products${toQuery(filters)}`),
  get: (id: string) => apiFetch<{ product: ProductDTO }>(`/products/${id}`),
  create: (data: ProductInput) =>
    apiFetch<{ product: ProductDTO }>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ProductInput> & { active?: boolean }) =>
    apiFetch<{ product: ProductDTO }>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) => apiFetch<void>(`/products/${id}`, { method: "DELETE" }),
};
