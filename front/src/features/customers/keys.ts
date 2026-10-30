export const customerKeys = {
  all: ["customers"] as const,
  list: (search?: string) => [...customerKeys.all, "list", search ?? ""] as const,
};
