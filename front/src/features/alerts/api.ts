import { apiFetch } from "@/lib/api-client";

export const alertsApi = {
  runExpiration: () =>
    apiFetch<{
      summary: { expiringSoon: number; lowStock: number; notifiedRecipients: string[] };
    }>(`/alerts/expiration/run`, { method: "POST" }),
};
