import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import {
  listProductsQuerySchema,
  productBodySchema,
  productIdParamSchema,
  updateProductBodySchema,
} from "../dtos/product.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";

export async function productRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService);
  const managerOnly = requireRole("ADMIN", "MANAGER");
  const logger = container.services.activityLogger;

  app.get("/products", { preHandler: authenticate }, async (req, reply) => {
    const query = listProductsQuerySchema.parse(req.query);
    const result = await container.useCases.listProducts.execute(query);
    return reply.send(result);
  });

  app.get("/products/:id", { preHandler: authenticate }, async (req, reply) => {
    const { id } = productIdParamSchema.parse(req.params);
    const product = await container.useCases.getProduct.execute(id);
    return reply.send({ product });
  });

  app.post("/products", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const body = productBodySchema.parse(req.body);
    const product = await container.useCases.createProduct.execute(body);
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "PRODUCT_CREATED", entity: "Product", entityId: product.id, metadata: { name: product.name, sku: product.sku } },
    );
    return reply.status(201).send({ product });
  });

  app.put("/products/:id", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const { id } = productIdParamSchema.parse(req.params);
    const body = updateProductBodySchema.parse(req.body);
    const product = await container.useCases.updateProduct.execute(id, body);
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
