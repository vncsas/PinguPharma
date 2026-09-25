import { z } from "zod";

export const createSaleBodySchema = z.object({
  customerId: z.string().nullish(),
  clientName: z.string().max(120).optional(),
  paymentMethod: z.enum(["CASH", "CREDIT", "DEBIT", "PIX", "OTHER"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(5),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});
export type CreateSaleBody = z.infer<typeof createSaleBodySchema>;

export const listSalesQuerySchema = z.object({
  status: z.enum(["COMPLETED", "CANCELED"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const saleIdParamSchema = z.object({ id: z.string().min(5) });
