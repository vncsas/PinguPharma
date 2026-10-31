import { z } from "zod";
import { boolQuery } from "./common.dtos.js";

const unitTypeEnum = z.enum(["UBS", "UPA", "CENTRAL", "HOSPITAL", "OTHER"]);

export const listUnitsQuerySchema = z.object({
  search: z.string().optional(),
  activeOnly: boolQuery,
});

export const createUnitBodySchema = z.object({
  name: z.string().min(2).max(120),
  cnes: z.string().max(20).nullish(),
  type: unitTypeEnum,
  active: z.boolean().optional(),
});

export const updateUnitBodySchema = createUnitBodySchema.partial();
