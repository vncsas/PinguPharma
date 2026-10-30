import { z } from "zod";

export const batchSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  lotNumber: z
    .string()
    .trim()
    .min(1, "Informe o lote")
    .max(60, "Máximo de 60 caracteres")
    .transform((v) => v.toUpperCase()),
  quantity: z
    .number({ invalid_type_error: "Informe a quantidade" })
    .int("Use um número inteiro")
    .positive("Deve ser maior que zero"),
  costPrice: z
    .number({ invalid_type_error: "Informe o custo" })
    .nonnegative("Não pode ser negativo"),
  expiresAt: z.string().min(1, "Informe a validade"),
});
