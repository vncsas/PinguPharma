import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshBody = z.infer<typeof refreshBodySchema>;

export const verify2faBodySchema = z.object({
  challengeToken: z.string().min(10),
  code: z.string().min(6).max(8),
});
export type Verify2FABody = z.infer<typeof verify2faBodySchema>;

export const enable2faBodySchema = z.object({
  confirm: z.boolean(),
  code: z.string().min(6).max(8).optional(),
});
export type Enable2FABody = z.infer<typeof enable2faBodySchema>;
