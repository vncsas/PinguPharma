import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../../../shared/container/container.js";
import {
  disable2faBodySchema,
  enable2faBodySchema,
  loginBodySchema,
  refreshBodySchema,
  verify2faBodySchema,
} from "../dtos/auth.dtos.js";
import { TwoFactorRequiredError } from "../../../shared/errors/AppError.js";
import { createAuthMiddleware } from "../middlewares/auth.js";
import { toPublicUser } from "../../../domain/entities/User.js";

const updateProfileBodySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
});

const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

const authLimit = { max: 10, timeWindow: "15 minutes" };

export async function authRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);

  app.post("/auth/login", { config: { rateLimit: authLimit } }, async (req, reply) => {
    const body = loginBodySchema.parse(req.body);
    try {
      const result = await container.useCases.login.execute(body);
      return reply.send(result);
    } catch (err) {
      if (err instanceof TwoFactorRequiredError) {
        return reply
          .status(200)
          .send({ status: "TWOFA_REQUIRED", challengeToken: err.challengeToken });
      }
      throw err;
    }
  });

  app.post("/auth/refresh", async (req, reply) => {
    const body = refreshBodySchema.parse(req.body);
    const tokens = await container.useCases.refresh.execute(body.refreshToken);
    return reply.send({ tokens });
  });

  app.post("/auth/2fa/verify", { config: { rateLimit: authLimit } }, async (req, reply) => {
    const body = verify2faBodySchema.parse(req.body);
    const result = await container.useCases.verify2fa.execute(body);
    return reply.send({ status: "AUTHENTICATED", ...result });
  });

  app.post("/auth/2fa/setup", { preHandler: authenticate }, async (req, reply) => {
    const body = enable2faBodySchema.parse(req.body);
    const result = await container.useCases.enable2fa.execute({
      userId: req.currentUser!.sub,
      code: body.code,
      confirm: body.confirm,
    });
    if (result.status === "CONFIRMED") {
      await container.services.activityLogger.log(
        { userId: req.currentUser!.sub, ipAddress: req.ip },
        { action: "TWOFA_ENABLED", entity: "User", entityId: req.currentUser!.sub },
      );
    }
    return reply.send(result);
  });

  app.delete("/auth/2fa", { preHandler: authenticate }, async (req, reply) => {
    const body = disable2faBodySchema.parse(req.body);
    await container.useCases.enable2fa.disable(req.currentUser!.sub, body.password);
    await container.services.activityLogger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "TWOFA_DISABLED", entity: "User", entityId: req.currentUser!.sub },
    );
    return reply.send({ status: "DISABLED" });
  });

  app.get("/auth/me", { preHandler: authenticate }, async (req, reply) => {
    const user = await container.repos.userRepo.findById(req.currentUser!.sub);
    if (!user) return reply.status(404).send({ error: "NOT_FOUND", message: "Usuário não encontrado" });
    const safe = toPublicUser(user);
    return reply.send({ user: safe });
  });

  app.put("/auth/me", { preHandler: authenticate }, async (req, reply) => {
    const body = updateProfileBodySchema.parse(req.body);
    const user = await container.useCases.updateProfile.execute(req.currentUser!.sub, body);
    await container.services.activityLogger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "PROFILE_UPDATED", entity: "User", entityId: user.id, metadata: body },
    );
    return reply.send({ user });
  });

  app.post("/auth/change-password", { preHandler: authenticate }, async (req, reply) => {
    const body = changePasswordBodySchema.parse(req.body);
    const tokens = await container.useCases.changePassword.execute(req.currentUser!.sub, body);
    await container.services.activityLogger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "PASSWORD_CHANGED", entity: "User", entityId: req.currentUser!.sub },
    );
    return reply.send({ tokens });
  });
}
