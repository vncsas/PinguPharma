import { z } from "zod";
import { isoDateQuery } from "./common.dtos.js";

const movementTypeEnum = z.enum([
  "ENTRY_PURCHASE",
  "ENTRY_DONATION",
  "ENTRY_TRANSFER",
  "DISPENSATION",
  "DISPENSATION_CANCEL",
  "LOSS_EXPIRED",
  "LOSS_DAMAGE",
  "ADJUSTMENT",
  "TRANSFER_OUT",
]);

export const listStockMovementsQuerySchema = z.object({
  productId: z.string().optional(),
  batchId: z.string().optional(),
  type: movementTypeEnum.optional(),
  from: isoDateQuery.optional(),
  to: isoDateQuery.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const registerLossBodySchema = z.object({
  batchId: z.string().min(5),
  quantity: z.number().int().positive().max(1_000_000),
  type: z.enum(["LOSS_EXPIRED", "LOSS_DAMAGE"]),
  reason: z.string().trim().min(3).max(300),
  document: z.string().max(60).nullish(),
});

export const registerAdjustmentBodySchema = z.object({
  batchId: z.string().min(5),
  newQuantity: z.number().int().min(0).max(1_000_000),
  reason: z.string().trim().min(3).max(300),
});
