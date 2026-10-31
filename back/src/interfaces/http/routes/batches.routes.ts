import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import {
  batchIdParamSchema,
  createBatchBodySchema,
  listBatchesQuerySchema,
} from "../dtos/batch.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";
import { requireUnitScope, resolveUnitScope } from "../unit-scope.js";

export async function batchesRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const managerOnly = requireRole("ADMIN", "MANAGER", "PHARMACIST");
  const logger = container.services.activityLogger;

  app.get("/batches", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const q = listBatchesQuerySchema.parse(req.query);
    const result = await container.useCases.listBatches.execute({ ...q, unitId: resolveUnitScope(req) });
    return reply.send(result);
  });

  app.post("/batches", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const body = createBatchBodySchema.parse(req.body);
    const batch = await container.useCases.createBatch.execute({
      unitId: requireUnitScope(req),
      userId: req.user!.id,
      entryType: body.entryType,
      supplierId: body.supplierId ?? null,
      document: body.document ?? null,
      productId: body.productId,
      lotNumber: body.lotNumber,
      quantity: body.quantity,
      costPrice: body.costPrice,
      expiresAt: new Date(body.expiresAt),
    });
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      {
        action: "STOCK_ENTRY",
        entity: "Batch",
        entityId: batch.id,
        metadata: { unitId: batch.unitId, productId: batch.productId, qty: batch.quantity, lot: batch.lotNumber, entryType: body.entryType },
      },
    );
    return reply.status(201).send({ batch });
  });

  app.delete("/batches/:id", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const { id } = batchIdParamSchema.parse(req.params);
    await container.useCases.deleteBatch.execute(id, req.user!.id, resolveUnitScope(req));
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "BATCH_DELETED", entity: "Batch", entityId: id },
    );
    return reply.status(204).send();
  });
}
