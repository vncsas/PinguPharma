import { z } from "zod";

export const requestResetBodySchema = z.object({
  email: z.string().email(),
});

export const confirmResetBodySchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});
