import type { IBatchRepository } from "../../../domain/repositories/IBatchRepository.js";
import type { IProductRepository } from "../../../domain/repositories/IProductRepository.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepository.js";
import type { IReportRepository } from "../../../domain/repositories/IReportRepository.js";
import type { IMailer } from "../../../domain/services/IMailer.js";
import type { ILogger } from "../../../domain/services/ILogger.js";
import type { IEmailTemplates } from "../../../domain/services/IEmailTemplates.js";
import type { NotificationType } from "../../../domain/entities/Notification.js";
import type { NotifyUsersUseCase } from "../notifications/NotifyUsersUseCase.js";

export interface UnitAlertsSummary {
  unitId: string;
  unitName: string;
  expiringSoon: number;
  expired: number;
  lowStock: number;
  stockCritical: number;
}

export interface AlertsSummary {
  expiringSoon: number;
  expired: number;
  lowStock: number;
  stockCritical: number;
  notifiedRecipients: string[];
  emailsSent: number;
  byUnit: UnitAlertsSummary[];
}

function dayKey(d: Date): string {
  return d.toLocaleDateString("sv-SE");
}

export class CheckExpirationAlertsUseCase {
  constructor(
    private readonly batches: IBatchRepository,
    private readonly products: IProductRepository,
    private readonly users: IUserRepository,
    private readonly units: IUnitRepository,
    private readonly reports: IReportRepository,
    private readonly notify: NotifyUsersUseCase,
    private readonly mailer: IMailer,
    private readonly templates: IEmailTemplates,
    private readonly logger: ILogger,
    private readonly webBaseUrl: string,
    private readonly daysAhead: number = 30,
  ) {}

  async execute(now: Date = new Date()): Promise<AlertsSummary> {
    const units = await this.units.list({ activeOnly: true });
    const summary: AlertsSummary = {
      expiringSoon: 0,
      expired: 0,
      lowStock: 0,
      stockCritical: 0,
      notifiedRecipients: [],
      emailsSent: 0,
      byUnit: [],
    };
    const notified = new Set<string>();

    for (const unit of units) {
      try {
        const r = await this.processUnit(unit.id, unit.name, now, notified);
        summary.expiringSoon += r.unit.expiringSoon;
        summary.expired += r.unit.expired;
        summary.lowStock += r.unit.lowStock;
        summary.stockCritical += r.unit.stockCritical;
        summary.emailsSent += r.emailsSent;
        summary.byUnit.push(r.unit);
      } catch (err) {
        this.logger.warn({ unitId: unit.id, err: err instanceof Error ? err.message : String(err) }, "Falha ao processar alertas da unidade");
      }
    }
    summary.notifiedRecipients = [...notified];
    return summary;
  }

  private async processUnit(
    unitId: string,
    unitName: string,
    now: Date,
    notified: Set<string>,
  ): Promise<{ unit: UnitAlertsSummary; emailsSent: number }> {
    const [soonRaw, expired, lowStock, coverage, recipientUsers] = await Promise.all([
      this.batches.findExpiringSoon(this.daysAhead, unitId),
      this.batches.findExpired(unitId),
      this.products.listLowStock(unitId),
      this.reports.stockCoverage({ unitId }),
      this.users.listRecipients(unitId, ["MANAGER", "PHARMACIST"]),
    ]);
    // findExpiringSoon usa lte e inclui vencidos; aqui só lotes ainda válidos com estoque.
    const expiringSoon = soonRaw.filter((b) => b.expiresAt >= now && b.quantity > 0);
    const critical = coverage
      .filter((c) => c.status === "CRITICAL" || (c.status === "RUPTURE" && c.avgDailyConsumption > 0))
      .map((c) => ({ name: c.productName, sku: c.productSku, currentStock: c.currentStock, coverageDays: c.coverageDays }));

    const unit: UnitAlertsSummary = {
      unitId,
      unitName,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      lowStock: lowStock.length,
      stockCritical: critical.length,
    };
    if (expiringSoon.length === 0 && expired.length === 0 && lowStock.length === 0 && critical.length === 0) {
      return { unit, emailsSent: 0 };
    }

    const recipients = recipientUsers.map((u) => ({ id: u.id, email: u.email }));
    const key = dayKey(now);
    const link = "/notificacoes";

    const specs: Array<{ type: NotificationType; count: number; title: string; body: string }> = [
      {
        type: "EXPIRED",
        count: expired.length,
        title: `Lotes vencidos em estoque — ${unitName}`,
        body: `${unitName}: ${expired.length} lote(s) já vencido(s) ainda com estoque. Separe-os para descarte.`,
      },
      {
        type: "EXPIRING_SOON",
        count: expiringSoon.length,
        title: `Lotes próximos do vencimento — ${unitName}`,
        body: `${unitName}: ${expiringSoon.length} lote(s) vencem em até ${this.daysAhead} dias.`,
      },
      {
        type: "LOW_STOCK",
        count: lowStock.length,
        title: `Estoque abaixo do mínimo — ${unitName}`,
        body: `${unitName}: ${lowStock.length} produto(s) estão com estoque abaixo do mínimo.`,
      },
      {
        type: "STOCK_CRITICAL",
        count: critical.length,
        title: `Estoque crítico — ${unitName}`,
        body: `${unitName}: ${critical.length} produto(s) com cobertura de até 7 dias ou em ruptura.`,
      },
    ];

    const emailTypesByUser = new Map<string, Set<NotificationType>>();
    for (const spec of specs) {
      if (spec.count === 0) continue;
      const results = await this.notify.execute({
        recipients,
        type: spec.type,
        title: spec.title,
        body: spec.body,
        link,
        dedupeKey: `${spec.type}:${unitId}:${key}`,
      });
      for (const r of results) {
        if (r.inAppCreated) notified.add(r.email);
        if (r.emailAllowed) {
          const set = emailTypesByUser.get(r.userId) ?? new Set<NotificationType>();
          set.add(spec.type);
          emailTypesByUser.set(r.userId, set);
        }
      }
    }

    let emailsSent = 0;
    for (const r of recipients) {
      const types = emailTypesByUser.get(r.id);
      if (!types || types.size === 0) continue;
      try {
        const content = this.templates.alerts({
          date: now.toLocaleDateString("pt-BR"),
          daysAhead: this.daysAhead,
          link: `${this.webBaseUrl}${link}`,
          unitName,
          expired: types.has("EXPIRED") ? expired : [],
          expiringSoon: types.has("EXPIRING_SOON") ? expiringSoon : [],
          lowStock: types.has("LOW_STOCK") ? lowStock : [],
          critical: types.has("STOCK_CRITICAL") ? critical : [],
        });
        await this.mailer.send({ to: r.email, ...content });
        notified.add(r.email);
        emailsSent++;
      } catch (err) {
        this.logger.warn({ to: r.email, err: err instanceof Error ? err.message : String(err) }, "Falha ao enviar resumo de alertas");
      }
    }
    return { unit, emailsSent };
  }
}
