import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { idParamSchema } from "../dtos/common.dtos.js";
import { createPrescriptionBodySchema, listPrescriptionsQuerySchema } from "../dtos/prescription.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";
import { requireUnitScope, resolveUnitScope } from "../unit-scope.js";

export async function prescriptionsRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const canCreate = requireRole("ADMIN", "MANAGER", "PHARMACIST");
  const logger = container.services.activityLogger;

  app.get("/prescriptions", { preHandler: authenticate }, async (req, reply) => {
    const query = listPrescriptionsQuerySchema.parse(req.query);
    const result = await container.useCases.listPrescriptions.execute({
      unitId: resolveUnitScope(req),
      patientId: query.patientId,
      validOnly: query.validOnly,
      page: query.page,
      pageSize: query.pageSize,
    });
    return reply.send(result);
  });

  app.get("/prescriptions/:id", { preHandler: authenticate }, async (req, reply) => {
    const { id } = idParamSchema.parse(req.params);
    const prescription = await container.useCases.getPrescription.execute(id, resolveUnitScope(req));
    return reply.send({ prescription });
  });

  app.post("/prescriptions", { preHandler: [authenticate, canCreate] }, async (req, reply) => {
    const body = createPrescriptionBodySchema.parse(req.body);
    const prescription = await container.useCases.createPrescription.execute({
      ...body,
      unitId: requireUnitScope(req),
      createdBy: req.user!.id,
    });
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      {
        action: "PRESCRIPTION_CREATED",
        entity: "Prescription",
        entityId: prescription.id,
        metadata: { patientId: prescription.patientId, unitId: prescription.unitId },
      },
    );
    return reply.status(201).send({ prescription });
  });
}
