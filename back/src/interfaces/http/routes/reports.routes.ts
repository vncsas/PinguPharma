import type { FastifyInstance } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { financialQuerySchema } from "../dtos/report.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";

function parseDate(input: string, endOfDay = false): Date {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    const [y, m, day] = input.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, day ?? 1, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0);
  }
  if (endOfDay && input.length === 10) {
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

export async function reportsRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService);
  const managerOnly = requireRole("ADMIN", "MANAGER");

  app.get("/reports/financial", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const q = financialQuerySchema.parse(req.query);
    const report = await container.useCases.financialReport.execute({
      from: parseDate(q.from, false),
      to: parseDate(q.to, true),
    });
    return reply.send({ report });
  });

  app.get("/reports/financial.csv", { preHandler: [authenticate, managerOnly] }, async (req, reply) => {
    const q = financialQuerySchema.parse(req.query);
    const csv = await container.useCases.financialReport.exportCsv({
      from: parseDate(q.from, false),
      to: parseDate(q.to, true),
    });
    return reply
      .type("text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="financeiro_${q.from}_${q.to}.csv"`)
      .send(csv);
  });
}
