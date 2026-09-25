import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../../../shared/container/container.js";
import { createCustomerBodySchema, listCustomersQuerySchema } from "../dtos/customer.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";

const updateCustomerBodySchema = createCustomerBodySchema.partial();
const customerIdParamSchema = z.object({ id: z.string().min(5) });

export async function customersRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService);
  const managerOnly = requireRole("ADMIN", "MANAGER");
  const logger = container.services.activityLogger;

  app.get("/customers", { preHandler: authenticate }, async (req, reply) => {
    const { search } = listCustomersQuerySchema.parse(req.query);
    const customers = await container.useCases.listCustomers.execute(search);
    return reply.send({ customers });
  });

  app.post("/customers", { preHandler: authenticate }, async (req, reply) => {
    const body = createCustomerBodySchema.parse(req.body);
    const customer = await container.useCases.createCustomer.execute(body);
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "CUSTOMER_CREATED", entity: "Customer", entityId: customer.id },
    );
    return reply.status(201).send({ customer });
  });

  app.put("/customers/:id", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const { id } = customerIdParamSchema.parse(req.params);
    const body = updateCustomerBodySchema.parse(req.body);
    const customer = await container.useCases.updateCustomer.execute(id, body);
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "CUSTOMER_UPDATED", entity: "Customer", entityId: id, metadata: body },
    );
    return reply.send({ customer });
  });

  app.delete(
    "/customers/:id",
    { preHandler: [authenticate, managerOnly] },
    async (req, reply) => {
      const { id } = customerIdParamSchema.parse(req.params);
      await container.useCases.deleteCustomer.execute(id);
      await logger.log(
        { userId: req.currentUser!.sub, ipAddress: req.ip },
        { action: "CUSTOMER_DELETED", entity: "Customer", entityId: id },
      );
      return reply.status(204).send();
    },
  );
}
