import { z } from "zod";

export const listTransfersQuerySchema = z.object({
  direction: z.enum(["in", "out"]).optional(),
  status: z.enum(["REQUESTED", "SENT", "RECEIVED", "REJECTED", "CANCELED"]).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const requestTransferBodySchema = z.object({
  fromUnitId: z.string().min(5),
  notes: z.string().trim().max(500).optional().nullable(),
  items: z
    .array(z.object({ productId: z.string().min(5), quantity: z.number().int().positive().max(1_000_000) }))
    .min(1)
    .max(100),
});

export const transferReasonBodySchema = z.object({ reason: z.string().trim().min(3).max(500) });
