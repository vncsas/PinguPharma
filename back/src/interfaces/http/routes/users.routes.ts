import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import {
  createUserBodySchema,
  listUsersQuerySchema,
  resetPasswordBodySchema,
  updateUserBodySchema,
  userIdParamSchema,
} from "../dtos/user.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";

export async function usersRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const adminOnly = requireRole("ADMIN");
  const logger = container.services.activityLogger;

  app.get("/users", { preHandler: [authenticate, adminOnly] }, async (req, reply) => {
    const query = listUsersQuerySchema.parse(req.query);
    const users = await container.useCases.listUsers.execute(query);
    return reply.send({ users });
  });

  app.post("/users", { preHandler: [authenticate, adminOnly] }, async (req, reply) => {
    const body = createUserBodySchema.parse(req.body);
    const user = await container.useCases.createUser.execute(body);
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "USER_CREATED", entity: "User", entityId: user.id, metadata: { role: user.role } },
    );
    return reply.status(201).send({ user });
  });

  app.put("/users/:id", { preHandler: [authenticate, adminOnly] }, async (req, reply) => {
    const { id } = userIdParamSchema.parse(req.params);
    const body = updateUserBodySchema.parse(req.body);
    const user = await container.useCases.updateUser.execute(id, body);
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "USER_UPDATED", entity: "User", entityId: id, metadata: body },
    );
    return reply.send({ user });
  });

  app.post(
    "/users/:id/reset-password",
    { preHandler: [authenticate, adminOnly] },
    async (req, reply) => {
      const { id } = userIdParamSchema.parse(req.params);
      const body = resetPasswordBodySchema.parse(req.body);
      await container.useCases.resetPassword.execute(id, body.password);
      await logger.log(
        { userId: req.currentUser!.sub, ipAddress: req.ip },
        { action: "PASSWORD_RESET", entity: "User", entityId: id },
      );
      return reply.status(204).send();
    },
  );

  app.delete("/users/:id", { preHandler: [authenticate, adminOnly] }, async (req, reply) => {
    const { id } = userIdParamSchema.parse(req.params);
    await container.useCases.deleteUser.execute(id, req.currentUser!.sub);
    await logger.log(
      { userId: req.currentUser!.sub, ipAddress: req.ip },
      { action: "USER_DELETED", entity: "User", entityId: id },
    );
    return reply.status(204).send();
  });
}
