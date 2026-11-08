import { z } from "zod";

const email = z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido");
const newPassword = z.string().min(8, "Mínimo de 8 caracteres");

export const loginSchema = z.object({
  email,
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Senhas não coincidem" });

export const changePasswordSchema = z
  .object({ current: z.string().min(1, "Informe a senha atual"), next: newPassword, confirm: z.string() })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Senhas não coincidem" });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Mínimo de 2 caracteres").max(120, "Máximo de 120 caracteres"),
  email,
});
