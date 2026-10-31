import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { idParamSchema } from "../dtos/common.dtos.js";
import {
  createSupplierBodySchema,
  listSuppliersQuerySchema,
  updateSupplierBodySchema,
} from "../dtos/supplier.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";

export async function suppliersRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const guard = requireRole("ADMIN", "MANAGER");
  const logger = container.services.activityLogger;

  app.get("/suppliers", { preHandler: [authenticate, guard] }, async (req, reply) => {
    const query = listSuppliersQuerySchema.parse(req.query);
    const suppliers = await container.useCases.listSuppliers.execute(query);
    return reply.send({ suppliers });
  });

  app.post("/suppliers", { preHandler: [authenticate, guard] }, async (req, reply) => {
    const body = createSupplierBodySchema.parse(req.body);
    const supplier = await container.useCases.createSupplier.execute(body);
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      { action: "SUPPLIER_CREATED", entity: "Supplier", entityId: supplier.id, metadata: { name: supplier.name } },
    );
    return reply.status(201).send({ supplier });
  });

  app.put("/suppliers/:id", { preHandler: [authenticate, guard] }, async (req, reply) => {
    const { id } = idParamSchema.parse(req.params);
    const body = updateSupplierBodySchema.parse(req.body);
    const supplier = await container.useCases.updateSupplier.execute(id, body);
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      { action: "SUPPLIER_UPDATED", entity: "Supplier", entityId: id, metadata: body },
    );
    return reply.send({ supplier });
  });
}
