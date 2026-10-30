export const reportKeys = {
  all: ["reports"] as const,
  financial: (from: string, to: string) => [...reportKeys.all, "financial", from, to] as const,
};
