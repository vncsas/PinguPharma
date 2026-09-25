import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { createAuthMiddleware } from "../middlewares/auth.js";

export async function dashboardRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService);

  app.get("/dashboard/metrics", { preHandler: authenticate }, async (_req, reply) => {
    const metrics = await container.useCases.dashboardMetrics.execute();
    return reply.send({ metrics });
  });
}
