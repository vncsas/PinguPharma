import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { idParamSchema } from "../dtos/common.dtos.js";
import {
  createPatientBodySchema,
  listPatientsQuerySchema,
  updatePatientBodySchema,
} from "../dtos/patient.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";

export async function patientsRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const canDelete = requireRole("ADMIN", "MANAGER", "PHARMACIST");
  const logger = container.services.activityLogger;

  app.get("/patients", { preHandler: authenticate }, async (req, reply) => {
    const query = listPatientsQuerySchema.parse(req.query);
    const result = await container.useCases.listPatients.execute({ ...query, documentExactOnly: req.user!.role !== "ADMIN" });
    return reply.send(result);
  });

  app.get("/patients/:id", { preHandler: authenticate }, async (req, reply) => {
    const { id } = idParamSchema.parse(req.params);
    const patient = await container.useCases.getPatient.execute(id);
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      { action: "PATIENT_VIEWED", entity: "Patient", entityId: id },
    );
    return reply.send({ patient });
  });

  app.post("/patients", { preHandler: authenticate }, async (req, reply) => {
    const body = createPatientBodySchema.parse(req.body);
    const patient = await container.useCases.createPatient.execute(body);
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      { action: "PATIENT_CREATED", entity: "Patient", entityId: patient.id },
    );
    return reply.status(201).send({ patient });
  });

  app.put("/patients/:id", { preHandler: authenticate }, async (req, reply) => {
    const { id } = idParamSchema.parse(req.params);
    const body = updatePatientBodySchema.parse(req.body);
    const patient = await container.useCases.updatePatient.execute(id, body);
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      { action: "PATIENT_UPDATED", entity: "Patient", entityId: id, metadata: { fields: Object.keys(body) } },
    );
    return reply.send({ patient });
  });

  app.delete("/patients/:id", { preHandler: [authenticate, canDelete] }, async (req, reply) => {
    const { id } = idParamSchema.parse(req.params);
    await container.useCases.deletePatient.execute(id);
    await logger.log(
      { userId: req.user!.id, ipAddress: req.ip },
      { action: "PATIENT_DELETED", entity: "Patient", entityId: id },
    );
    return reply.status(204).send();
  });
}
