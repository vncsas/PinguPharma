import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { buildContainer } from "./shared/container/container.js";
import { registerErrorHandler } from "./interfaces/http/middlewares/error-handler.js";
import { authRoutes } from "./interfaces/http/routes/auth.routes.js";
import { productRoutes } from "./interfaces/http/routes/products.routes.js";
import { dashboardRoutes } from "./interfaces/http/routes/dashboard.routes.js";
import { salesRoutes } from "./interfaces/http/routes/sales.routes.js";
import { customersRoutes } from "./interfaces/http/routes/customers.routes.js";
import { usersRoutes } from "./interfaces/http/routes/users.routes.js";
import { auditRoutes } from "./interfaces/http/routes/audit.routes.js";
import { reportsRoutes } from "./interfaces/http/routes/reports.routes.js";
import { batchesRoutes } from "./interfaces/http/routes/batches.routes.js";
import { passwordResetRoutes } from "./interfaces/http/routes/password-reset.routes.js";
import { alertsRoutes } from "./interfaces/http/routes/alerts.routes.js";
import { logger } from "./shared/logger.js";

export async function buildApp() {
  const app = Fastify({ loggerInstance: logger });
  const container = buildContainer();

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: env.CORS_ORIGIN.split(","), credentials: true });
  await app.register(sensible);
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  registerErrorHandler(app);

  app.get("/health", () => ({ status: "ok", service: "pingupharma-api" }));

  await app.register(async (scoped) => {
    await authRoutes(scoped, container);
    await productRoutes(scoped, container);
    await dashboardRoutes(scoped, container);
    await salesRoutes(scoped, container);
    await customersRoutes(scoped, container);
    await usersRoutes(scoped, container);
    await auditRoutes(scoped, container);
    await reportsRoutes(scoped, container);
    await batchesRoutes(scoped, container);
    await passwordResetRoutes(scoped, container);
    await alertsRoutes(scoped, container);
  }, { prefix: "/api/v1" });

  return app;
}
