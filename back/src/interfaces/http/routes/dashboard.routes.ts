import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { resolveUnitScope } from "../unit-scope.js";
import { createAuthMiddleware } from "../middlewares/auth.js";

export async function dashboardRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);

  app.get("/dashboard/metrics", { preHandler: authenticate }, async (req, reply) => {
    const metrics = await container.useCases.dashboardMetrics.execute(resolveUnitScope(req));
    return reply.send({ metrics });
  });
}
