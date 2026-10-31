import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { idParamSchema } from "../dtos/common.dtos.js";
import { createUnitBodySchema, listUnitsQuerySchema, updateUnitBodySchema } from "../dtos/unit.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";

export async function unitsRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const adminOnly = requireRole("ADMIN");
  const logger = container.services.activityLogger;

  app.get("/units", { preHandler: authenticate }, async (req, reply) => {
    const query = listUnitsQuerySchema.parse(req.query);
    const units = await container.useCases.listUnits.execute(req.user!, query);
    return reply.send({ units });
  });

  app.post("/units", { preHandler: [authenticate, adminOnly] }, async (req, reply) => {
    const body = createUnitBodySchema.parse(req.body);
    const unit = await container.useCases.createUnit.execute(body);
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      { action: "UNIT_CREATED", entity: "Unit", entityId: unit.id, metadata: { name: unit.name } },
    );
    return reply.status(201).send({ unit });
  });

  app.put("/units/:id", { preHandler: [authenticate, adminOnly] }, async (req, reply) => {
    const { id } = idParamSchema.parse(req.params);
    const body = updateUnitBodySchema.parse(req.body);
    const unit = await container.useCases.updateUnit.execute(id, body);
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      { action: "UNIT_UPDATED", entity: "Unit", entityId: id, metadata: body },
    );
    return reply.send({ unit });
  });
}
