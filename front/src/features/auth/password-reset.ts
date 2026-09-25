import { apiFetch } from "@/lib/api-client";

export const passwordResetApi = {
  request: (email: string) =>
    apiFetch<{ sent: boolean; devToken?: string }>(`/auth/password-reset/request`, {
      method: "POST",
      body: JSON.stringify({ email }),
      auth: false,
    }),
  confirm: (token: string, password: string) =>
    apiFetch<void>(`/auth/password-reset/confirm`, {
      method: "POST",
      body: JSON.stringify({ token, password }),
      auth: false,
    }),
};
