import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { createAuthMiddleware } from "../middlewares/auth.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  updatePreferencesBodySchema,
} from "../dtos/notification.dtos.js";

export async function notificationsRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const uc = container.useCases;

  app.get("/notifications", { preHandler: authenticate }, async (req, reply) => {
    const q = listNotificationsQuerySchema.parse(req.query);
    const result = await uc.listNotifications.execute({
      userId: req.currentUser!.sub,
      unreadOnly: q.unread,
      page: q.page,
      pageSize: q.pageSize,
    });
    return reply.send(result);
  });

  app.get("/notifications/preferences", { preHandler: authenticate }, async (req, reply) => {
    return reply.send(await uc.getNotificationPreferences.execute(req.currentUser!.sub));
  });

  app.put("/notifications/preferences", { preHandler: authenticate }, async (req, reply) => {
    const body = updatePreferencesBodySchema.parse(req.body);
    return reply.send(await uc.updateNotificationPreferences.execute(req.currentUser!.sub, body));
  });

  app.post("/notifications/read-all", { preHandler: authenticate }, async (req, reply) => {
    return reply.send(await uc.markAllNotificationsRead.execute(req.currentUser!.sub));
  });

  app.patch("/notifications/:id/read", { preHandler: authenticate }, async (req, reply) => {
    const { id } = notificationIdParamSchema.parse(req.params);
    await uc.markNotificationRead.execute(id, req.currentUser!.sub);
    return reply.status(204).send();
  });
}
