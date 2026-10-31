import "dotenv/config";
import { z } from "zod";

const EXAMPLE_JWT_SECRET = "change-me-supersecret-min-32-chars-long-string";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  TWOFA_ISSUER: z.string().default("PinguPharma"),
  EXPOSE_DEV_RESET_TOKEN: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  MAIL_DRIVER: z.enum(["console", "smtp"]).default("console"),
  MAIL_FROM: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ALERTS_SCHEDULE_ENABLED: z.enum(["true", "false"]).optional(),
  ALERTS_RUN_HOUR: z.coerce.number().int().min(0).max(23).default(7),
}).superRefine((v, ctx) => {
  if (v.NODE_ENV === "production" && v.JWT_SECRET === EXAMPLE_JWT_SECRET) {
    ctx.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "JWT_SECRET não pode ser o valor do .env.example em produção" });
  }
  if (v.MAIL_DRIVER !== "smtp") return;
  for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"] as const) {
    if (v[key] === undefined || v[key] === "") {
      ctx.addIssue({ code: "custom", path: [key], message: `${key} é obrigatória quando MAIL_DRIVER=smtp` });
    }
  }
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = {
  ...parsed.data,
  ALERTS_SCHEDULE_ENABLED: parsed.data.ALERTS_SCHEDULE_ENABLED
    ? parsed.data.ALERTS_SCHEDULE_ENABLED === "true"
    : parsed.data.NODE_ENV !== "test",
};
export type Env = typeof env;
