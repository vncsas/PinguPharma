import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { idParamSchema } from "../dtos/common.dtos.js";
import {
  listTransfersQuerySchema,
  requestTransferBodySchema,
  transferReasonBodySchema,
} from "../dtos/transfer.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";
import { requireUnitScope, resolveUnitScope } from "../unit-scope.js";

export async function transfersRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const staff = requireRole("ADMIN", "MANAGER", "PHARMACIST");
  const logger = container.services.activityLogger;
  const uc = container.useCases;

  app.get("/transfers", { preHandler: authenticate }, async (req, reply) => {
    const q = listTransfersQuerySchema.parse(req.query);
    const result = await uc.listTransfers.execute({ ...q, unitId: resolveUnitScope(req) });
    return reply.send(result);
  });

  app.get("/transfers/:id", { preHandler: authenticate }, async (req, reply) => {
    const { id } = idParamSchema.parse(req.params);
    const transfer = await uc.getTransfer.execute(id, req.user!);
    return reply.send({ transfer });
  });

  app.post("/transfers", { preHandler: [authenticate, staff] }, async (req, reply) => {
    const body = requestTransferBodySchema.parse(req.body);
    const transfer = await uc.requestTransfer.execute({
      userId: req.user!.id,
      toUnitId: requireUnitScope(req),
      fromUnitId: body.fromUnitId,
      notes: body.notes,
      items: body.items,
    });
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      {
        action: "TRANSFER_REQUESTED",
        entity: "Transfer",
        entityId: transfer.id,
        metadata: { fromUnitId: transfer.fromUnitId, toUnitId: transfer.toUnitId, items: body.items },
      },
    );
    return reply.status(201).send({ transfer });
  });

  const transitions = [
    { path: "send", action: "send", log: "TRANSFER_SENT", reason: false },
    { path: "receive", action: "receive", log: "TRANSFER_RECEIVED", reason: false },
    { path: "reject", action: "reject", log: "TRANSFER_REJECTED", reason: true },
    { path: "cancel", action: "cancel", log: "TRANSFER_CANCELED", reason: true },
  ] as const;

  for (const t of transitions) {
    app.post(`/transfers/:id/${t.path}`, { preHandler: [authenticate, staff] }, async (req, reply) => {
      const { id } = idParamSchema.parse(req.params);
      const reason = t.reason ? transferReasonBodySchema.parse(req.body).reason : undefined;
      const transfer = await uc.transitionTransfer.execute(t.action, id, req.user!, reason);
      await logger.log(
        { userId: req.user!.id, ipAddress: req.ip },
        {
          action: t.log,
          entity: "Transfer",
          entityId: transfer.id,
          metadata: { status: transfer.status, ...(reason ? { reason } : {}) },
        },
      );
      return reply.send({ transfer });
    });
  }
}
