import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";

export async function alertsRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService);
  const adminOnly = requireRole("ADMIN");
  const logger = container.services.activityLogger;

  app.post(
    "/alerts/expiration/run",
    { preHandler: [authenticate, adminOnly] },
    async (req, reply) => {
      const summary = await container.useCases.checkExpirationAlerts.execute();
      await logger.log(
        { userId: req.currentUser!.sub, ipAddress: req.ip },
        {
          action: "ALERTS_TRIGGERED",
          entity: "Alerts",
          metadata: summary,
        },
      );
      return reply.send({ summary });
    },
  );
}
