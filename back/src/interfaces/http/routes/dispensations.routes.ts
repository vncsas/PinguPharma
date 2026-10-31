import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { parseFilterDate } from "../../../shared/utils/dates.js";
import { idParamSchema } from "../dtos/common.dtos.js";
import {
  cancelDispensationBodySchema,
  createDispensationBodySchema,
  listDispensationsQuerySchema,
} from "../dtos/dispensation.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";
import { requireUnitScope, resolveUnitScope } from "../unit-scope.js";
import { renderReceiptHtml } from "../views/receipt.js";

export async function dispensationsRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const canCancel = requireRole("ADMIN", "MANAGER", "PHARMACIST");
  const logger = container.services.activityLogger;

  app.get("/dispensations", { preHandler: authenticate }, async (req, reply) => {
    const raw = listDispensationsQuerySchema.parse(req.query);
    const result = await container.useCases.listDispensations.execute({
      unitId: resolveUnitScope(req),
      status: raw.status,
      userId: raw.userId,
      patientId: raw.patientId,
      prescriptionId: raw.prescriptionId,
      from: raw.from ? parseFilterDate(raw.from) : undefined,
      to: raw.to ? parseFilterDate(raw.to, true) : undefined,
      page: raw.page,
      pageSize: raw.pageSize,
    });
    return reply.send(result);
  });

  app.get("/dispensations/:id", { preHandler: authenticate }, async (req, reply) => {
    const { id } = idParamSchema.parse(req.params);
    const dispensation = await container.useCases.getDispensation.execute(id, resolveUnitScope(req));
    return reply.send({ dispensation });
  });

  app.post("/dispensations", { preHandler: authenticate }, async (req, reply) => {
    const body = createDispensationBodySchema.parse(req.body);
    const dispensation = await container.useCases.createDispensation.execute({
      unitId: requireUnitScope(req),
      actor: { id: req.user!.id, role: req.user!.role },
      patientId: body.patientId ?? null,
      prescriptionId: body.prescriptionId ?? null,
      items: body.items,
    });
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      {
        action: "DISPENSATION_CREATED",
        entity: "Dispensation",
        entityId: dispensation.id,
        metadata: {
          unitId: dispensation.unitId,
          patientId: dispensation.patientId,
          prescriptionId: dispensation.prescriptionId,
          items: dispensation.items.length,
        },
      },
    );
    return reply.status(201).send({ dispensation });
  });

  app.post("/dispensations/:id/cancel", { preHandler: [authenticate, canCancel] }, async (req, reply) => {
    const { id } = idParamSchema.parse(req.params);
    const body = cancelDispensationBodySchema.parse(req.body);
    const dispensation = await container.useCases.cancelDispensation.execute(id, {
      userId: req.user!.id,
      reason: body.reason,
      unitId: resolveUnitScope(req),
    });
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      { action: "DISPENSATION_CANCELED", entity: "Dispensation", entityId: id, metadata: { reason: body.reason } },
    );
    return reply.send({ dispensation });
  });

  app.get("/dispensations/:id/receipt", { preHandler: authenticate }, async (req, reply) => {
    const { id } = idParamSchema.parse(req.params);
    const dispensation = await container.useCases.getDispensation.execute(id, resolveUnitScope(req));
    return reply.type("text/html; charset=utf-8").send(renderReceiptHtml(dispensation));
  });
}
