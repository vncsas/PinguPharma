import Fastify, { type FastifyBaseLogger } from "fastify";
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
import { dispensationsRoutes } from "./interfaces/http/routes/dispensations.routes.js";
import { patientsRoutes } from "./interfaces/http/routes/patients.routes.js";
import { prescriptionsRoutes } from "./interfaces/http/routes/prescriptions.routes.js";
import { unitsRoutes } from "./interfaces/http/routes/units.routes.js";
import { suppliersRoutes } from "./interfaces/http/routes/suppliers.routes.js";
import { stockRoutes } from "./interfaces/http/routes/stock.routes.js";
import { usersRoutes } from "./interfaces/http/routes/users.routes.js";
import { auditRoutes } from "./interfaces/http/routes/audit.routes.js";
import { reportsRoutes } from "./interfaces/http/routes/reports.routes.js";
import { batchesRoutes } from "./interfaces/http/routes/batches.routes.js";
import { passwordResetRoutes } from "./interfaces/http/routes/password-reset.routes.js";
import { notificationsRoutes } from "./interfaces/http/routes/notifications.routes.js";
import { transfersRoutes } from "./interfaces/http/routes/transfers.routes.js";
import { alertsRoutes } from "./interfaces/http/routes/alerts.routes.js";
import { logger } from "./shared/logger.js";

export async function buildApp() {
  const app = Fastify({ logger: logger as FastifyBaseLogger });
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
    await dispensationsRoutes(scoped, container);
    await patientsRoutes(scoped, container);
    await prescriptionsRoutes(scoped, container);
    await unitsRoutes(scoped, container);
    await suppliersRoutes(scoped, container);
    await stockRoutes(scoped, container);
    await usersRoutes(scoped, container);
    await auditRoutes(scoped, container);
    await reportsRoutes(scoped, container);
    await batchesRoutes(scoped, container);
    await passwordResetRoutes(scoped, container);
    await transfersRoutes(scoped, container);
    await alertsRoutes(scoped, container);
    await notificationsRoutes(scoped, container);
  }, { prefix: "/api/v1" });

  if (env.ALERTS_SCHEDULE_ENABLED) {
    container.services.alertsScheduler.start();
    app.addHook("onClose", async () => container.services.alertsScheduler.stop());
  }

  return app;
}
