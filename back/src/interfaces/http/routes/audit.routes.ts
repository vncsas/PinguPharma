import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { listAuditQuerySchema } from "../dtos/audit.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";

export async function auditRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService);
  const adminOnly = requireRole("ADMIN");

  app.get("/audit-logs", { preHandler: [authenticate, adminOnly] }, async (req, reply) => {
    const raw = listAuditQuerySchema.parse(req.query);
    const result = await container.useCases.listActivityLogs.execute({
      entity: raw.entity,
      action: raw.action,
      userId: raw.userId,
      from: raw.from ? new Date(raw.from) : undefined,
      to: raw.to ? new Date(raw.to) : undefined,
      page: raw.page,
      pageSize: raw.pageSize,
    });
    return reply.send(result);
  });

  app.get("/audit-logs/facets", { preHandler: [authenticate, adminOnly] }, async (_req, reply) => {
    const facets = await container.useCases.listActivityLogs.facets();
    return reply.send(facets);
  });
}
