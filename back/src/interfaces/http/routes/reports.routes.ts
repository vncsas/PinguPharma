import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Container } from "../../../shared/container/container.js";
import { ValidationError } from "../../../shared/errors/AppError.js";
import { parseFilterDate } from "../../../shared/utils/dates.js";
import { toCsv } from "../../../shared/utils/csv.js";
import {
  consumptionQuerySchema,
  coverageQuerySchema,
  dispensationsReportQuerySchema,
  ledgerQuerySchema,
  periodQuerySchema,
} from "../dtos/report.dtos.js";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.js";
import { resolveUnitScope } from "../unit-scope.js";

function parseDate(input: string, endOfDay = false): Date {
  const d = parseFilterDate(input, endOfDay);
  if (Number.isNaN(d.getTime())) throw new ValidationError("Data inválida");
  return d;
}

function period(q: { from?: string; to?: string }): { from: Date; to: Date } {
  const to = q.to ? parseDate(q.to, true) : new Date();
  const from = q.from ? parseDate(q.from, false) : new Date(to.getTime() - 30 * 86_400_000);
  return { from, to };
}

async function sendCsvAudited(
  container: Container,
  req: FastifyRequest,
  reply: FastifyReply,
  name: string,
  headers: string[],
  rows: unknown[][],
) {
  await container.services.activityLogger.log(
    { userId: req.user!.id, ipAddress: req.ip },
    {
      action: "REPORT_EXPORTED",
      entity: "Report",
      entityId: name,
      metadata: { report: name, filters: req.query as Record<string, unknown>, unitId: resolveUnitScope(req) ?? "ALL", rows: rows.length },
    },
  );
  return reply
    .header("Content-Type", "text/csv; charset=utf-8")
    .header("Content-Disposition", `attachment; filename="${name}.csv"`)
    .send(toCsv(headers, rows));
}

export async function reportsRoutes(app: FastifyInstance, container: Container) {
  const authenticate = createAuthMiddleware(container.services.tokenService, container.services.sessionValidator);
  const guard = requireRole("ADMIN", "MANAGER", "PHARMACIST");
  const pre = { preHandler: [authenticate, guard] };
  const uc = container.useCases;

  app.get("/reports/consumption", pre, async (req, reply) => {
    const q = consumptionQuerySchema.parse(req.query);
    const rows = await uc.consumptionReport.execute({
      unitId: resolveUnitScope(req),
      productId: q.productId,
      from: parseDate(q.from, false),
      to: parseDate(q.to, true),
    });
    return reply.send({ rows });
  });

  app.get("/reports/consumption.csv", pre, async (req, reply) => {
    const q = consumptionQuerySchema.parse(req.query);
    const rows = await uc.consumptionReport.execute({
      unitId: resolveUnitScope(req),
      productId: q.productId,
      from: parseDate(q.from, false),
      to: parseDate(q.to, true),
    });
    return sendCsvAudited(
      container,
      req,
      reply,
      "consumo",
      ["Unidade", "Produto", "SKU", "Quantidade", "Dispensações", "Valor total"],
      rows.map((r) => [r.unitName, r.productName, r.productSku, r.quantity, r.dispensationCount, r.totalValue.toFixed(2)]),
    );
  });

  app.get("/reports/stock-coverage", pre, async (req, reply) => {
    const q = coverageQuerySchema.parse(req.query);
    const rows = await uc.stockCoverageReport.execute({ unitId: resolveUnitScope(req), productId: q.productId });
    return reply.send({ rows });
  });

  app.get("/reports/stock-coverage.csv", pre, async (req, reply) => {
    const q = coverageQuerySchema.parse(req.query);
    const rows = await uc.stockCoverageReport.execute({ unitId: resolveUnitScope(req), productId: q.productId });
    return sendCsvAudited(
      container,
      req,
      reply,
      "cobertura-estoque",
      ["Unidade", "Produto", "SKU", "Estoque", "Mínimo", "Consumo médio diário", "Cobertura (dias)", "Situação"],
      rows.map((r) => [r.unitName, r.productName, r.productSku, r.currentStock, r.minStockAlert, r.avgDailyConsumption, r.coverageDays, r.status]),
    );
  });

  app.get("/reports/losses", pre, async (req, reply) => {
    const q = periodQuerySchema.parse(req.query);
    const report = await uc.lossesReport.execute({ unitId: resolveUnitScope(req), productId: q.productId, ...period(q) });
    return reply.send({ report });
  });

  app.get("/reports/losses.csv", pre, async (req, reply) => {
    const q = periodQuerySchema.parse(req.query);
    const report = await uc.lossesReport.execute({ unitId: resolveUnitScope(req), productId: q.productId, ...period(q) });
    return sendCsvAudited(
      container,
      req,
      reply,
      "perdas",
      ["Data", "Unidade", "Produto", "Lote", "Tipo", "Quantidade", "Valor", "Motivo", "Documento", "Usuário"],
      report.rows.map((r) => [r.createdAt, r.unitName, r.productName, r.lotNumber, r.type, r.quantity, r.value.toFixed(2), r.reason, r.document, r.userName]),
    );
  });

  app.get("/reports/dispensations", pre, async (req, reply) => {
    const q = dispensationsReportQuerySchema.parse(req.query);
    const rows = await uc.dispensationsReport.execute({ unitId: resolveUnitScope(req), groupBy: q.groupBy, ...period(q) });
    return reply.send({ groupBy: q.groupBy, rows });
  });

  app.get("/reports/dispensations.csv", pre, async (req, reply) => {
    const q = dispensationsReportQuerySchema.parse(req.query);
    const rows = await uc.dispensationsReport.execute({ unitId: resolveUnitScope(req), groupBy: q.groupBy, ...period(q) });
    return sendCsvAudited(
      container,
      req,
      reply,
      `dispensacoes-por-${q.groupBy === "patient" ? "paciente" : "prescritor"}`,
      [q.groupBy === "patient" ? "Paciente" : "Prescritor", "Dispensações", "Itens", "Valor total"],
      rows.map((r) => [r.label, r.dispensationCount, r.itemQuantity, r.totalValue.toFixed(2)]),
    );
  });

  // Livro e balanço de controlados
  const ledgerHeaders = [
    "Data", "Tipo", "Quantidade", "Saldo", "Unidade", "Lote", "Motivo", "Documento", "Usuário",
    "Paciente", "CPF", "CNS", "Receita", "Prescritor", "Conselho", "Nº conselho", "Farmacêutico",
  ];

  app.get("/controlled/ledger", pre, async (req, reply) => {
    const q = ledgerQuerySchema.parse(req.query);
    const ledger = await uc.controlledLedger.execute({
      productId: q.productId,
      unitId: resolveUnitScope(req),
      from: q.from ? parseDate(q.from, false) : undefined,
      to: q.to ? parseDate(q.to, true) : undefined,
    });
    return reply.send({ ledger });
  });

  app.get("/controlled/ledger.csv", pre, async (req, reply) => {
    const q = ledgerQuerySchema.parse(req.query);
    const ledger = await uc.controlledLedger.execute({
      productId: q.productId,
      unitId: resolveUnitScope(req),
      from: q.from ? parseDate(q.from, false) : undefined,
      to: q.to ? parseDate(q.to, true) : undefined,
    });
    return sendCsvAudited(
      container,
      req,
      reply,
      "livro-controlados",
      ledgerHeaders,
      ledger.entries.map((e) => [
        e.createdAt, e.type, e.quantity, e.balance, e.unitName, e.lotNumber, e.reason, e.document, e.userName,
        e.patientName, e.patientCpf, e.patientCns, e.prescriptionNumber, e.prescriberName,
        e.prescriberCouncil, e.prescriberCouncilNumber, e.pharmacistName,
      ]),
    );
  });

  app.get("/controlled/balance", pre, async (req, reply) => {
    const rows = await uc.controlledBalance.execute({ unitId: resolveUnitScope(req) });
    return reply.send({ rows });
  });

  app.get("/controlled/balance.csv", pre, async (req, reply) => {
    const rows = await uc.controlledBalance.execute({ unitId: resolveUnitScope(req) });
    return sendCsvAudited(
      container,
      req,
      reply,
      "balanco-controlados",
      ["Unidade", "Produto", "Classe", "Total em lotes", "Total no livro", "Divergência", "Lotes"],
      rows.map((r) => [
        r.unitName, r.productName, r.controlledClass, r.batchTotal, r.ledgerTotal, r.divergence,
        r.batches.map((b) => `${b.lotNumber}:${b.quantity}`).join("; "),
      ]),
    );
  });
}
