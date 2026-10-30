import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2, "Mínimo de 2 caracteres").max(120, "Máximo de 120 caracteres"),
  sku: z
    .string()
    .trim()
    .min(2, "Mínimo de 2 caracteres")
    .max(60, "Máximo de 60 caracteres")
    .transform((v) => v.toUpperCase()),
  description: z.string().max(500, "Máximo de 500 caracteres"),
  price: z.number({ invalid_type_error: "Informe o preço" }).positive("Deve ser maior que zero"),
  minStockAlert: z
    .number({ invalid_type_error: "Informe um número" })
    .int("Use um número inteiro")
    .min(0, "Não pode ser negativo"),
  active: z.boolean(),
});
