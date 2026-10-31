import type { ITransferRepository, ListTransfersQuery, PaginatedTransfers } from "../../../domain/repositories/ITransferRepository.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepository.js";
import type { IProductRepository } from "../../../domain/repositories/IProductRepository.js";
import type { IEmailTemplates } from "../../../domain/services/IEmailTemplates.js";
import type { TransferDetail } from "../../../domain/entities/Transfer.js";
import type { NotificationType } from "../../../domain/entities/Notification.js";
import type { UserRole } from "../../../domain/entities/User.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";
import type { NotifyUsersUseCase } from "../notifications/NotifyUsersUseCase.js";

export interface TransferActor {
  id: string;
  role: UserRole;
  unitId: string | null;
}

const code = (t: { id: string }) => t.id.slice(-8).toUpperCase();

function involves(actor: TransferActor, t: { fromUnitId: string; toUnitId: string }): boolean {
  return actor.role === "ADMIN" || actor.unitId === t.fromUnitId || actor.unitId === t.toUnitId;
}

export class ListTransfersUseCase {
  constructor(private readonly transfers: ITransferRepository) {}

  /** unitId undefined = todas (ADMIN sem X-Unit-Id). */
  execute(query: ListTransfersQuery): Promise<PaginatedTransfers> {
    return this.transfers.list(query);
  }
}

export class GetTransferUseCase {
  constructor(private readonly transfers: ITransferRepository) {}

  async execute(id: string, actor: TransferActor): Promise<TransferDetail> {
    const t = await this.transfers.findDetail(id);
    if (!t || !involves(actor, t)) throw new NotFoundError("Transfer");
    return t;
  }
}

class TransferNotifier {
  constructor(
    private readonly users: IUserRepository,
    private readonly notify: NotifyUsersUseCase,
    private readonly templates: IEmailTemplates,
    private readonly webBaseUrl: string,
  ) {}

  async toUnit(unitId: string, actorId: string, type: NotificationType, title: string, message: string): Promise<void> {
    try {
      const recipients = (await this.users.listRecipients(unitId, ["MANAGER", "PHARMACIST"]))
        .filter((u) => u.id !== actorId)
        .map((u) => ({ id: u.id, email: u.email }));
      if (recipients.length === 0) return;
      await this.notify.execute({
        recipients,
        type,
        title,
        body: message,
        link: "/transferencias",
        email: this.templates.transferNotice({ title, message, link: `${this.webBaseUrl}/transferencias` }),
      });
    } catch {
      // notificar nunca invalida a operação
    }
  }
}

export class RequestTransferUseCase {
  private readonly notifier: TransferNotifier;

  constructor(
    private readonly transfers: ITransferRepository,
    private readonly units: IUnitRepository,
    private readonly products: IProductRepository,
    users: IUserRepository,
    notify: NotifyUsersUseCase,
    templates: IEmailTemplates,
    webBaseUrl: string,
  ) {
    this.notifier = new TransferNotifier(users, notify, templates, webBaseUrl);
  }

  async execute(input: {
    userId: string;
    toUnitId: string;
    fromUnitId: string;
    notes?: string | null;
    items: { productId: string; quantity: number }[];
  }): Promise<TransferDetail> {
    if (input.fromUnitId === input.toUnitId) throw new ValidationError("A unidade de origem deve ser diferente da unidade solicitante");
    const [from, to] = await Promise.all([this.units.findById(input.fromUnitId), this.units.findById(input.toUnitId)]);
    if (!from || !from.active) throw new NotFoundError("Unit");
    if (!to || !to.active) throw new NotFoundError("Unit");

    const merged = new Map<string, number>();
    for (const i of input.items) merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.quantity);
    const items = [...merged].map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) throw new ValidationError("Informe ao menos um item");
    for (const i of items) {
      if (!Number.isInteger(i.quantity) || i.quantity <= 0) throw new ValidationError("Quantidade inválida");
      const p = await this.products.findById(i.productId);
      if (!p || !p.active) throw new NotFoundError("Product");
    }

    const transfer = await this.transfers.request({
      fromUnitId: input.fromUnitId,
      toUnitId: input.toUnitId,
      requestedBy: input.userId,
      notes: input.notes ?? null,
      items,
    });
    await this.notifier.toUnit(
      transfer.fromUnitId,
      input.userId,
      "TRANSFER_PENDING",
      "Transferência solicitada",
      `A unidade ${transfer.toUnitName} solicitou ${transfer.items.length} item(ns) (transferência ${code(transfer)}). Envie os produtos.`,
    );
    return transfer;
  }
}

type Action = "send" | "receive" | "reject" | "cancel";

export class TransitionTransferUseCase {
  private readonly notifier: TransferNotifier;

  constructor(
    private readonly transfers: ITransferRepository,
    users: IUserRepository,
    notify: NotifyUsersUseCase,
    templates: IEmailTemplates,
    webBaseUrl: string,
  ) {
    this.notifier = new TransferNotifier(users, notify, templates, webBaseUrl);
  }

  async execute(action: Action, id: string, actor: TransferActor, reason?: string): Promise<TransferDetail> {
    const t = await this.transfers.findDetail(id);
    if (!t || !involves(actor, t)) throw new NotFoundError("Transfer");
    const isAdmin = actor.role === "ADMIN";
    const isFrom = isAdmin || actor.unitId === t.fromUnitId;
    const isTo = isAdmin || actor.unitId === t.toUnitId;
    const trimmed = reason?.trim() || undefined;

    let result: TransferDetail;
    let title: string;
    let message: string;
    switch (action) {
      case "send":
        if (!isFrom) throw new ForbiddenError("Somente a unidade de origem pode enviar");
        if (t.status !== "REQUESTED") throw new ConflictError("Transferência não está solicitada");
        result = await this.transfers.send(id, actor.id);
        title = "Transferência enviada";
        message = `A unidade ${t.fromUnitName} enviou a transferência ${code(t)}. Confirme o recebimento ao chegar.`;
        break;
      case "receive":
        if (!isTo) throw new ForbiddenError("Somente a unidade de destino pode receber");
        if (t.status !== "SENT") throw new ConflictError("Transferência não está enviada");
        result = await this.transfers.receive(id, actor.id);
        title = "Transferência recebida";
        message = `A unidade ${t.toUnitName} recebeu a transferência ${code(t)}.`;
        break;
      case "reject":
        if (t.status === "REQUESTED" ? !isFrom : !isTo) {
          throw new ForbiddenError(
            t.status === "REQUESTED" ? "Somente a unidade de origem pode recusar" : "Somente a unidade de destino pode recusar",
          );
        }
        if (t.status !== "REQUESTED" && t.status !== "SENT") throw new ConflictError("Transferência não pode ser recusada");
        if (!trimmed) throw new ValidationError("Informe o motivo da recusa");
        result = await this.transfers.reject(id, actor.id, trimmed);
        title = "Transferência recusada";
        message = `A transferência ${code(t)} foi recusada. Motivo: ${trimmed}.`;
        break;
      default:
        if (t.status === "REQUESTED" ? !isTo : !isFrom) {
          throw new ForbiddenError(
            t.status === "REQUESTED" ? "Somente a unidade solicitante pode cancelar" : "Somente a unidade de origem pode cancelar após o envio",
          );
        }
        if (t.status !== "REQUESTED" && t.status !== "SENT") throw new ConflictError("Transferência não pode ser cancelada");
        if (!trimmed) throw new ValidationError("Informe o motivo do cancelamento");
        result = await this.transfers.cancel(id, actor.id, trimmed);
        title = "Transferência cancelada";
        message = `A transferência ${code(t)} foi cancelada. Motivo: ${trimmed}.`;
    }

    const notifyUnit = actor.role === "ADMIN" ? t.toUnitId : actor.unitId === t.fromUnitId ? t.toUnitId : t.fromUnitId;
    const targets = actor.role === "ADMIN" ? [t.fromUnitId, t.toUnitId] : [notifyUnit];
    for (const u of targets) await this.notifier.toUnit(u, actor.id, "TRANSFER_UPDATE", title, message);
    return result;
  }
}
