import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import {
  batchIdParamSchema,
  createBatchBodySchema,
  listBatchesQuerySchema,
} from "../dtos/batch.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";

export async function batchesRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService);
  const managerOnly = requireRole("ADMIN", "MANAGER");
  const logger = container.services.activityLogger;

  app.get("/batches", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const q = listBatchesQuerySchema.parse(req.query);
    const result = await container.useCases.listBatches.execute(q);
    return reply.send(result);
  });

  app.post("/batches", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const body = createBatchBodySchema.parse(req.body);
    const batch = await container.useCases.createBatch.execute({
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
        metadata: { productId: batch.productId, qty: batch.quantity, lot: batch.lotNumber },
      },
    );
    return reply.status(201).send({ batch });
  });

  app.delete("/batches/:id", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const { id } = batchIdParamSchema.parse(req.params);
    await container.useCases.deleteBatch.execute(id);
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "BATCH_DELETED", entity: "Batch", entityId: id },
    );
    return reply.status(204).send();
  });
}
