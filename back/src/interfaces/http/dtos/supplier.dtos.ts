import { z } from "zod";
import { boolQuery } from "./common.dtos.js";

const supplierTypeEnum = z.enum(["BIDDING", "DONATION", "MUNICIPAL_CENTRAL", "OTHER"]);

export const listSuppliersQuerySchema = z.object({
  search: z.string().optional(),
  activeOnly: boolQuery,
});

export const createSupplierBodySchema = z.object({
  name: z.string().min(2).max(120),
  cnpj: z.string().max(20).nullish(),
  type: supplierTypeEnum,
  active: z.boolean().optional(),
});

export const updateSupplierBodySchema = createSupplierBodySchema.partial();
