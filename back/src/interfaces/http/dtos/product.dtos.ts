import { z } from "zod";

export const listProductsQuerySchema = z.object({
  search: z.string().optional(),
  active: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  lowStockOnly: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const productBodySchema = z.object({
  name: z.string().min(2).max(120),
  sku: z.string().min(2).max(60),
  description: z.string().max(500).nullish(),
  price: z.number().positive(),
  minStockAlert: z.number().int().min(0).default(0),
});

export const updateProductBodySchema = productBodySchema.partial().extend({
  active: z.boolean().optional(),
});

export const productIdParamSchema = z.object({ id: z.string().min(5) });
