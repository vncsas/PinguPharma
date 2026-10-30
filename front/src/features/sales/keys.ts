import type { SalesFilters } from "./api";

export const saleKeys = {
  all: ["sales"] as const,
  list: (filters: SalesFilters) => [...saleKeys.all, "list", filters] as const,
  detail: (id: string) => [...saleKeys.all, "detail", id] as const,
};
