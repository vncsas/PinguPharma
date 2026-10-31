import { apiFetch } from "@/lib/api-client";

export type ControlledClass =
  | "NONE"
  | "A1"
  | "A2"
  | "A3"
  | "B1"
  | "B2"
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "C5";

export const CONTROLLED_CLASSES: ControlledClass[] = [
  "NONE", "A1", "A2", "A3", "B1", "B2", "C1", "C2", "C3", "C4", "C5",
];

export const isControlled = (c: ControlledClass) => c !== "NONE";

export interface ProductDTO {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  /** Valor de referência (prestação de contas), não é preço de venda. */
  price: number;
  minStockAlert: number;
  active: boolean;
  controlledClass: ControlledClass;
  activeIngredient: string | null;
  presentation: string | null;
  measureUnit: string | null;
  manufacturer: string | null;
  renameCode: string | null;
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
  controlled?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProductInput {
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  minStockAlert: number;
  controlledClass: ControlledClass;
  activeIngredient?: string | null;
  presentation?: string | null;
  measureUnit?: string | null;
  manufacturer?: string | null;
  renameCode?: string | null;
}

function toQuery(filters: ProductFilters) {
  const p = new URLSearchParams();
  if (filters.search) p.set("search", filters.search);
  if (filters.active !== undefined) p.set("active", String(filters.active));
  if (filters.lowStockOnly) p.set("lowStockOnly", "true");
  if (filters.controlled !== undefined) p.set("controlled", String(filters.controlled));
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
