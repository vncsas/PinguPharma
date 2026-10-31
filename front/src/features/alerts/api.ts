import { apiFetch } from "@/lib/api-client";

export const alertsApi = {
  runExpiration: () =>
    apiFetch<{
      summary: {
        expiringSoon: number;
        expired: number;
        lowStock: number;
        stockCritical: number;
        byUnit: Array<{
          unitId: string;
          unitName: string;
          expiringSoon: number;
          expired: number;
          lowStock: number;
          stockCritical: number;
        }>;
        notifiedRecipients: string[];
        emailsSent: number;
      };
    }>(`/alerts/expiration/run`, { method: "POST" }),
};
