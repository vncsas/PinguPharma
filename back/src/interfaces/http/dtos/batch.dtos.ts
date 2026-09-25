import { z } from "zod";

export const listBatchesQuerySchema = z.object({
  productId: z.string().optional(),
  expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createBatchBodySchema = z.object({
  productId: z.string().min(5),
  lotNumber: z.string().min(1).max(60),
  quantity: z.number().int().positive(),
  costPrice: z.number().nonnegative(),
  expiresAt: z.string(),
});

export const batchIdParamSchema = z.object({ id: z.string().min(5) });
