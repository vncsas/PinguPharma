import { apiFetch } from "@/lib/api-client";

export interface TwoFactorSetupPayload {
  status: "SETUP" | "CONFIRMED";
  setup?: { secret: string; otpauthUrl: string; qrCodeDataUrl: string };
}

export const authApi = {
  startTwoFactor: () =>
    apiFetch<TwoFactorSetupPayload>("/auth/2fa/setup", {
      method: "POST",
      body: JSON.stringify({ confirm: false }),
    }),
  confirmTwoFactor: (code: string) =>
    apiFetch<TwoFactorSetupPayload>("/auth/2fa/setup", {
      method: "POST",
      body: JSON.stringify({ confirm: true, code }),
    }),
  disableTwoFactor: () =>
    apiFetch<{ status: "DISABLED" }>("/auth/2fa", { method: "DELETE" }),
};
