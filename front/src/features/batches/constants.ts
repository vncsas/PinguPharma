export const EXPIRING_FILTERS: { label: string; days: number | undefined }[] = [
  { label: "Todos", days: undefined },
  { label: "≤ 7d", days: 7 },
  { label: "≤ 30d", days: 30 },
  { label: "≤ 90d", days: 90 },
];
