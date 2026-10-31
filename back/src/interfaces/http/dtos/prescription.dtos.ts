import { z } from "zod";
import { boolQuery } from "./common.dtos.js";

export const listPrescriptionsQuerySchema = z.object({
  patientId: z.string().optional(),
  validOnly: boolQuery,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createPrescriptionBodySchema = z.object({
  patientId: z.string().min(5),
  prescriberName: z.string().min(2).max(120),
  prescriberCouncil: z.enum(["CRM", "CRO", "COREN", "OTHER"]),
  prescriberCouncilNumber: z.string().min(1).max(30),
  number: z.string().max(40).nullish(),
  issuedAt: z.coerce.date(),
  validUntil: z.coerce.date(),
  retained: z.boolean().optional(),
  notes: z.string().max(1000).nullish(),
});
