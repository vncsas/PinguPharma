import { z } from "zod";
import { isValidFilterDate } from "../../../shared/utils/dates.js";

export const idParamSchema = z.object({ id: z.string().min(5) });

export const boolQuery = z
  .union([z.literal("true"), z.literal("false")])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === "true"));

export const isoDateQuery = z.string().refine((v) => isValidFilterDate(v), "Data inválida");
