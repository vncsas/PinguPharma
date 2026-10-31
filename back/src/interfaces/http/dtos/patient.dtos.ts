import { z } from "zod";
import { boolQuery } from "./common.dtos.js";

export const listPatientsQuerySchema = z.object({
  search: z.string().optional(),
  active: boolQuery,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createPatientBodySchema = z.object({
  name: z.string().min(2).max(120),
  cpf: z.string().max(20).nullish(),
  cns: z.string().max(20).nullish(),
  birthDate: z.coerce.date().nullish(),
  phone: z.string().max(30).nullish(),
  email: z.string().email().nullish(),
  address: z.string().max(300).nullish(),
  notes: z.string().max(1000).nullish(),
  active: z.boolean().optional(),
});

export const updatePatientBodySchema = createPatientBodySchema.partial();
