import type { IBatchRepository } from "../../../domain/repositories/IBatchRepository.js";
import type { IProductRepository } from "../../../domain/repositories/IProductRepository.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IMailer } from "../../../domain/services/IMailer.js";

export interface AlertsSummary {
  expiringSoon: number;
  lowStock: number;
  notifiedRecipients: string[];
}

export class CheckExpirationAlertsUseCase {
  constructor(
    private readonly batches: IBatchRepository,
    private readonly products: IProductRepository,
    private readonly users: IUserRepository,
    private readonly mailer: IMailer,
    private readonly daysAhead: number = 30,
  ) {}

  async execute(): Promise<AlertsSummary> {
    const [batches, lowStock, admins] = await Promise.all([
      this.batches.findExpiringSoon(this.daysAhead),
      this.products.countLowStock(),
      this.users.list({ role: "ADMIN", status: "ACTIVE" }),
    ]);

    if (batches.length === 0 && lowStock === 0) {
      return { expiringSoon: 0, lowStock: 0, notifiedRecipients: [] };
    }

    const rows = batches
      .slice(0, 30)
      .map(
        (b) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #E8EAF0;">${b.productName}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #E8EAF0;color:#5B6478;">${b.lotNumber}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #E8EAF0;">${b.quantity} un.</td>
          <td style="padding:6px 10px;border-bottom:1px solid #E8EAF0;">${b.expiresAt.toLocaleDateString("pt-BR")}</td>
        </tr>`,
      )
      .join("");

    const html = `
      <div style="font-family:Inter,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
        <h1 style="color:#0A0F1E;font-size:20px;">PinguPharma — Alertas diários</h1>
        <p style="color:#5B6478;">Resumo automático de compliance.</p>
        <p><strong>${batches.length}</strong> lote(s) vencendo em até ${this.daysAhead} dias.</p>
        <p><strong>${lowStock}</strong> produto(s) com estoque abaixo do mínimo.</p>
        ${
          batches.length > 0
            ? `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px;">
                <thead><tr style="background:#F1F3F9;text-align:left;"><th style="padding:6px 10px;">Produto</th><th style="padding:6px 10px;">Lote</th><th style="padding:6px 10px;">Qtd</th><th style="padding:6px 10px;">Validade</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>`
            : ""
        }
      </div>`;

    const recipients = admins.map((u) => u.email);
    for (const email of recipients) {
      await this.mailer.send({
        to: email,
        subject: `PinguPharma — ${batches.length} lote(s) vencendo · ${lowStock} baixo estoque`,
        html,
      });
    }

    return { expiringSoon: batches.length, lowStock, notifiedRecipients: recipients };
  }
}
