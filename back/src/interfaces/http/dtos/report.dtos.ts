import { z } from "zod";

export const financialQuerySchema = z.object({
  from: z.string(),
  to: z.string(),
});
