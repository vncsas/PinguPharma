import type { UserFilters } from "./api";

export const userKeys = {
  all: ["users"] as const,
  list: (filters: UserFilters) => [...userKeys.all, "list", filters] as const,
};
