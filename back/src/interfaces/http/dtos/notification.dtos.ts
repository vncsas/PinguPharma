import { z } from "zod";

const typeEnum = z.enum(["EXPIRING_SOON", "EXPIRED", "LOW_STOCK", "STOCK_CRITICAL", "TRANSFER_PENDING", "TRANSFER_UPDATE", "SECURITY", "SYSTEM"]);

export const listNotificationsQuerySchema = z.object({
  unread: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => v === "true" || v === "1"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const notificationIdParamSchema = z.object({ id: z.string().min(5) });

export const updatePreferencesBodySchema = z
  .array(z.object({ type: typeEnum, inApp: z.boolean(), email: z.boolean() }))
  .min(1)
  .max(8)
  .refine((a) => new Set(a.map((p) => p.type)).size === a.length, "Tipos duplicados");
