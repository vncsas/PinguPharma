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
  disableTwoFactor: (password: string) =>
    apiFetch<{ status: "DISABLED" }>("/auth/2fa", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),
  updateProfile: (data: { name: string; email: string }) =>
    apiFetch<{ user: unknown }>("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
