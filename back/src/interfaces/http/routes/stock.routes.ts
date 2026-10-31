import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { parseFilterDate } from "../../../shared/utils/dates.js";
import {
  listStockMovementsQuerySchema,
  registerAdjustmentBodySchema,
  registerLossBodySchema,
} from "../dtos/stock.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";
import { requireUnitScope, resolveUnitScope } from "../unit-scope.js";

export async function stockRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const stockRoles = requireRole("ADMIN", "MANAGER", "PHARMACIST");
  const logger = container.services.activityLogger;

  app.get("/stock-movements", { preHandler: [authenticate, stockRoles] }, async (req, reply) => {
    const q = listStockMovementsQuerySchema.parse(req.query);
    const result = await container.useCases.listStockMovements.execute({
      unitId: resolveUnitScope(req),
      productId: q.productId,
      batchId: q.batchId,
      type: q.type,
      from: q.from ? parseFilterDate(q.from) : undefined,
      to: q.to ? parseFilterDate(q.to, true) : undefined,
      page: q.page,
      pageSize: q.pageSize,
    });
    return reply.send(result);
  });

  app.post("/stock/losses", { preHandler: [authenticate, stockRoles] }, async (req, reply) => {
    const body = registerLossBodySchema.parse(req.body);
    const movement = await container.useCases.registerLoss.execute(
      { ...body, userId: req.user!.id },
      requireUnitScope(req),
    );
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      {
        action: "STOCK_LOSS",
        entity: "StockMovement",
        entityId: movement.id,
        metadata: { batchId: body.batchId, quantity: body.quantity, type: body.type, reason: body.reason },
      },
    );
    return reply.status(201).send({ movement });
  });

  app.post("/stock/adjustments", { preHandler: [authenticate, stockRoles] }, async (req, reply) => {
    const body = registerAdjustmentBodySchema.parse(req.body);
    const movement = await container.useCases.registerAdjustment.execute(
      { ...body, userId: req.user!.id },
      requireUnitScope(req),
    );
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      {
        action: "STOCK_ADJUSTMENT",
        entity: "StockMovement",
        entityId: movement.id,
        metadata: { batchId: body.batchId, newQuantity: body.newQuantity, reason: body.reason },
      },
    );
    return reply.status(201).send({ movement });
  });
}
