import { z } from "zod";

const controlledClassEnum = z.enum(["NONE", "A1", "A2", "A3", "B1", "B2", "C1", "C2", "C3", "C4", "C5"]);

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
  controlled: z
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
  price: z.number().nonnegative(),
  minStockAlert: z.number().int().min(0).default(0),
  controlledClass: controlledClassEnum.default("NONE"),
  activeIngredient: z.string().max(160).nullish(),
  presentation: z.string().max(160).nullish(),
  measureUnit: z.string().max(40).nullish(),
  manufacturer: z.string().max(120).nullish(),
  renameCode: z.string().max(40).nullish(),
});

export const updateProductBodySchema = productBodySchema.partial().extend({
  active: z.boolean().optional(),
});

export const productIdParamSchema = z.object({ id: z.string().min(5) });
