import { z } from "zod";
import { isValidFilterDate, parseFilterDate } from "../../../shared/utils/dates.js";

const MAX_RANGE_DAYS = 366;

function validDate(v: string): boolean {
  return isValidFilterDate(v);
}

const dateField = z.string().refine(validDate, "Data inválida");

function withRange<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((q: { from?: string; to?: string }, ctx) => {
    if (!q.from && !q.to) return;
    const to = q.to ? parseFilterDate(q.to, true).getTime() : Date.now();
    const from = q.from ? parseFilterDate(q.from).getTime() : to - 30 * 86_400_000;
    if (Number.isNaN(to) || Number.isNaN(from)) return;
    if (from > to) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["from"], message: "A data inicial não pode ser posterior à final" });
    } else if ((to - from) / 86_400_000 > MAX_RANGE_DAYS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["to"], message: `Intervalo máximo de ${MAX_RANGE_DAYS} dias` });
    }
  });
}

export const consumptionQuerySchema = withRange(
  z.object({
    from: dateField,
    to: dateField,
    productId: z.string().optional(),
  }),
);

/** from/to opcionais: padrão = últimos 30 dias. */
export const periodQuerySchema = withRange(
  z.object({
    from: dateField.optional(),
    to: dateField.optional(),
    productId: z.string().optional(),
  }),
);

export const coverageQuerySchema = z.object({ productId: z.string().optional() });

export const dispensationsReportQuerySchema = withRange(
  z.object({
    from: dateField.optional(),
    to: dateField.optional(),
    productId: z.string().optional(),
    groupBy: z.enum(["patient", "prescriber"]).default("patient"),
  }),
);

export const ledgerQuerySchema = withRange(
  z.object({
    productId: z.string().min(5),
    from: dateField.optional(),
    to: dateField.optional(),
  }),
);
