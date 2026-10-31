import { z } from "zod";
import { isoDateQuery } from "./common.dtos.js";

export const createDispensationBodySchema = z.object({
  patientId: z.string().min(5).nullish(),
  prescriptionId: z.string().min(5).nullish(),
  items: z
    .array(
      z.object({
        productId: z.string().min(5),
        quantity: z.number().int().positive().max(1_000_000),
      }),
    )
    .min(1)
    .max(100),
});

export const cancelDispensationBodySchema = z.object({
  reason: z.string().trim().min(3).max(300),
});

export const listDispensationsQuerySchema = z.object({
  status: z.enum(["COMPLETED", "CANCELED"]).optional(),
  from: isoDateQuery.optional(),
  to: isoDateQuery.optional(),
  userId: z.string().optional(),
  patientId: z.string().optional(),
  prescriptionId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
