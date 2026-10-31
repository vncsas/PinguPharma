import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import {
  listProductsQuerySchema,
  productBodySchema,
  productIdParamSchema,
  updateProductBodySchema,
} from "../dtos/product.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";
import { resolveUnitScope } from "../unit-scope.js";

export async function productRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const managerOnly = requireRole("ADMIN", "MANAGER");
  const logger = container.services.activityLogger;

  app.get("/products", { preHandler: authenticate }, async (req, reply) => {
    const query = listProductsQuerySchema.parse(req.query);
    const result = await container.useCases.listProducts.execute({ ...query, unitId: resolveUnitScope(req) });
    return reply.send(result);
  });

  app.get("/products/:id", { preHandler: authenticate }, async (req, reply) => {
    const { id } = productIdParamSchema.parse(req.params);
    const product = await container.useCases.getProduct.execute(id, resolveUnitScope(req));
    return reply.send({ product });
  });

  app.post("/products", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const body = productBodySchema.parse(req.body);
    const product = await container.useCases.createProduct.execute(body, req.user!.role);
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "PRODUCT_CREATED", entity: "Product", entityId: product.id, metadata: { name: product.name, sku: product.sku } },
    );
    if (product.controlledClass !== "NONE") {
      await logger.log(
        { userId: req.currentUser!.sub, ipAddress: req.ip },
        {
          action: "PRODUCT_CONTROLLED_CLASS_CHANGED",
          entity: "Product",
          entityId: product.id,
          metadata: { from: "NONE", to: product.controlledClass },
        },
      );
    }
    return reply.status(201).send({ product });
  });

  app.put("/products/:id", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const { id } = productIdParamSchema.parse(req.params);
    const body = updateProductBodySchema.parse(req.body);
    const previous = await container.useCases.getProduct.execute(id);
    const product = await container.useCases.updateProduct.execute(id, body, req.user!.role);
    if (product.controlledClass !== previous.controlledClass) {
      await logger.log(
        { userId: req.currentUser!.sub, ipAddress: req.ip },
        {
          action: "PRODUCT_CONTROLLED_CLASS_CHANGED",
          entity: "Product",
          entityId: id,
          metadata: { from: previous.controlledClass, to: product.controlledClass },
        },
      );
    }
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "PRODUCT_UPDATED", entity: "Product", entityId: id, metadata: body },
    );
    return reply.send({ product });
  });

  app.delete("/products/:id", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const { id } = productIdParamSchema.parse(req.params);
    await container.useCases.deleteProduct.execute(id);
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "PRODUCT_DELETED", entity: "Product", entityId: id },
    );
    return reply.status(204).send();
  });
}
