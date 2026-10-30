import type { BatchFilters } from "./api";

export const batchKeys = {
  all: ["batches"] as const,
  list: (filters: BatchFilters) => [...batchKeys.all, "list", filters] as const,
};
