import { apiFetch } from "@/lib/api-client";

export type SupplierType = "BIDDING" | "DONATION" | "MUNICIPAL_CENTRAL" | "OTHER";

export const SUPPLIER_TYPE_LABEL: Record<SupplierType, string> = {
  BIDDING: "Licitação",
  DONATION: "Doação",
  MUNICIPAL_CENTRAL: "Central municipal",
  OTHER: "Outro",
};

export interface SupplierDTO {
  id: string;
  name: string;
  cnpj: string | null;
  type: SupplierType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInput {
  name: string;
  cnpj?: string | null;
  type: SupplierType;
  active?: boolean;
}

export const suppliersApi = {
  list: (params: { search?: string; activeOnly?: boolean } = {}) => {
    const p = new URLSearchParams();
    if (params.search) p.set("search", params.search);
    if (params.activeOnly) p.set("activeOnly", "true");
    const qs = p.toString();
    return apiFetch<{ suppliers: SupplierDTO[] }>(`/suppliers${qs ? `?${qs}` : ""}`);
  },
  create: (data: SupplierInput) =>
    apiFetch<{ supplier: SupplierDTO }>("/suppliers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<SupplierInput>) =>
    apiFetch<{ supplier: SupplierDTO }>(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};
