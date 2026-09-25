import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { confirmResetBodySchema, requestResetBodySchema } from "../dtos/password-reset.dtos.js";

export async function passwordResetRoutes(app: FastifyInstance, container: Container) {
  app.post("/auth/password-reset/request", async (req, reply) => {
    const body = requestResetBodySchema.parse(req.body);
    const result = await container.useCases.requestPasswordReset.execute(body.email);
    return reply.send(result);
  });

  app.post("/auth/password-reset/confirm", async (req, reply) => {
    const body = confirmResetBodySchema.parse(req.body);
    await container.useCases.confirmPasswordReset.execute(body);
    return reply.status(204).send();
  });
}
