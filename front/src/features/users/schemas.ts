import { z } from "zod";
import { ROLES, STATUSES } from "./constants";

const name = z.string().trim().min(2, "Mínimo de 2 caracteres").max(120, "Máximo de 120 caracteres");
const email = z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido");

export const createUserSchema = z.object({
  name,
  email,
  password: z.string().min(8, "Mínimo de 8 caracteres"),
  role: z.enum(ROLES),
});

export const editUserSchema = z.object({
  name,
  email,
  role: z.enum(ROLES),
  status: z.enum(STATUSES),
});

export const resetUserPasswordSchema = z.object({
  password: z.string().min(8, "Mínimo de 8 caracteres"),
});
