import { z } from "zod";
import type { CustomerInput } from "./api";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Mínimo de 2 caracteres").max(120, "Máximo de 120 caracteres"),
  document: z.string().trim().max(30, "Máximo de 30 caracteres"),
  phone: z.string().trim().max(30, "Máximo de 30 caracteres"),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido")]),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

/** Campos opcionais em branco viram `null`: a API rejeita e-mail `""`. */
export function toCustomerInput(values: CustomerFormValues): CustomerInput {
  return {
    name: values.name,
    document: values.document || null,
    phone: values.phone || null,
    email: values.email || null,
  };
}
