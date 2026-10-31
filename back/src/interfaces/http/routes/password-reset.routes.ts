import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { confirmResetBodySchema, requestResetBodySchema } from "../dtos/password-reset.dtos.js";

const resetLimit = { max: 5, timeWindow: "15 minutes" };

export async function passwordResetRoutes(app: FastifyInstance, container: Container) {
  app.post("/auth/password-reset/request", { config: { rateLimit: resetLimit } }, async (req, reply) => {
    const body = requestResetBodySchema.parse(req.body);
    const result = await container.useCases.requestPasswordReset.execute(body.email);
    await container.services.activityLogger.log(
      { userId: null, ipAddress: req.ip },
      { action: "PASSWORD_RESET_REQUESTED", entity: "User" },
    );
    return reply.send(result);
  });

  app.post("/auth/password-reset/confirm", { config: { rateLimit: resetLimit } }, async (req, reply) => {
    const body = confirmResetBodySchema.parse(req.body);
    const { userId } = await container.useCases.confirmPasswordReset.execute(body);
    await container.services.activityLogger.log(
      { userId, ipAddress: req.ip },
      { action: "PASSWORD_RESET_CONFIRMED", entity: "User", entityId: userId },
    );
    return reply.status(204).send();
  });
}
