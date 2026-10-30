import { apiFetch } from "@/lib/api-client";
import type { AuthUser } from "@/lib/auth-context";

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
  updateProfile: (data: { name?: string; email?: string }) =>
    apiFetch<{ user: AuthUser }>("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
