import { z } from "zod";

export const listCustomersQuerySchema = z.object({
  search: z.string().optional(),
});

export const createCustomerBodySchema = z.object({
  name: z.string().min(2).max(120),
  document: z.string().max(30).nullish(),
  phone: z.string().max(30).nullish(),
  email: z.string().email().nullish(),
});
