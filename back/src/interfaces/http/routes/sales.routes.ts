import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import {
  createSaleBodySchema,
  listSalesQuerySchema,
  saleIdParamSchema,
} from "../dtos/sale.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";
import { renderReceiptHtml } from "../views/receipt.js";

export async function salesRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService);
  const managerOnly = requireRole("ADMIN", "MANAGER");
  const logger = container.services.activityLogger;

  app.get("/sales", { preHandler: authenticate }, async (req, reply) => {
    const raw = listSalesQuerySchema.parse(req.query);
    const result = await container.useCases.listSales.execute({
      status: raw.status,
      userId: raw.userId,
      from: raw.from ? new Date(raw.from) : undefined,
      to: raw.to ? new Date(raw.to) : undefined,
      page: raw.page,
      pageSize: raw.pageSize,
    });
    return reply.send(result);
  });

  app.get("/sales/:id", { preHandler: authenticate }, async (req, reply) => {
    const { id } = saleIdParamSchema.parse(req.params);
    const sale = await container.useCases.getSale.execute(id);
    return reply.send({ sale });
  });

  app.post("/sales", { preHandler: authenticate }, async (req, reply) => {
    const body = createSaleBodySchema.parse(req.body);
    const sale = await container.useCases.createSale.execute({
      userId: req.currentUser!.sub,
      customerId: body.customerId ?? null,
      clientName: body.clientName,
      paymentMethod: body.paymentMethod,
      items: body.items,
    });
    return reply.status(201).send({ sale });
  });

  app.post(
    "/sales/:id/cancel",
    { preHandler: [authenticate, managerOnly] },
    async (req, reply) => {
      const { id } = saleIdParamSchema.parse(req.params);
      const sale = await container.useCases.cancelSale.execute(id);
      await logger.log(
        { userId: req.currentUser!.sub, ipAddress: req.ip },
        { action: "SALE_CANCELED", entity: "Sale", entityId: id, metadata: { total: sale.totalAmount } },
      );
      return reply.send({ sale });
    },
  );

  app.get("/sales/:id/receipt", { preHandler: authenticate }, async (req, reply) => {
    const { id } = saleIdParamSchema.parse(req.params);
    const sale = await container.useCases.getSale.execute(id);
    return reply.type("text/html; charset=utf-8").send(renderReceiptHtml(sale));
  });
}
