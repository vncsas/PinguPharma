import type {
  DispensationDetail,
  IDispensationRepository,
  ListDispensationsQuery,
  PaginatedDispensations,
} from "../../../domain/repositories/IDispensationRepository.js";
import type { IProductRepository } from "../../../domain/repositories/IProductRepository.js";
import type { IPrescriptionRepository } from "../../../domain/repositories/IPrescriptionRepository.js";
import type { IPatientRepository } from "../../../domain/repositories/IPatientRepository.js";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepository.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { UserRole } from "../../../domain/entities/User.js";
import { AppError, ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";
import { maskCns, maskCpf } from "../../../shared/utils/documents.js";
import type { IEmailTemplates } from "../../../domain/services/IEmailTemplates.js";
import type { NotifyUsersUseCase } from "../notifications/NotifyUsersUseCase.js";

const CONTROLLED_ROLES: UserRole[] = ["ADMIN", "MANAGER", "PHARMACIST"];

function maskDetail(d: DispensationDetail): DispensationDetail {
  return { ...d, patientCpf: maskCpf(d.patientCpf), patientCns: maskCns(d.patientCns) };
}

export interface CreateDispensationInput {
  unitId: string;
  actor: { id: string; role: UserRole };
  patientId?: string | null;
  prescriptionId?: string | null;
  items: { productId: string; quantity: number }[];
}

export class CreateDispensationUseCase {
  constructor(
    private readonly dispensations: IDispensationRepository,
    private readonly products: IProductRepository,
    private readonly prescriptions: IPrescriptionRepository,
    private readonly patients: IPatientRepository,
    private readonly units: IUnitRepository,
  ) {}

  async execute(input: CreateDispensationInput): Promise<DispensationDetail> {
    const unit = await this.units.findById(input.unitId);
    if (!unit) throw new NotFoundError("Unit");
    if (!unit.active) throw new AppError("Unidade inativa não pode realizar dispensações", 422);
    if (input.patientId) {
      const patient = await this.patients.findById(input.patientId);
      if (!patient) throw new NotFoundError("Patient");
      if (!patient.active) throw new AppError("Paciente inativo não pode receber dispensações", 422);
    }
    const products = await Promise.all(input.items.map((i) => this.products.findById(i.productId)));
    const missing = products.findIndex((p) => !p);
    if (missing >= 0) throw new NotFoundError("Product");
    const controlled = products.filter((p) => p && p.controlledClass !== "NONE");

    const prescriptionId = input.prescriptionId ?? null;
    if (controlled.length > 0) {
      const names = controlled.map((p) => p!.name).join(", ");
      if (!CONTROLLED_ROLES.includes(input.actor.role)) {
        throw new ForbiddenError(`Apenas farmacêutico, gerente ou administrador pode dispensar medicamento controlado (${names})`);
      }
      if (!input.patientId) throw new ValidationError("Paciente é obrigatório para dispensar medicamento controlado");
      if (!prescriptionId) throw new ValidationError("Receita é obrigatória para dispensar medicamento controlado");
    }
    if (prescriptionId) {
      const prescription = await this.prescriptions.findById(prescriptionId);
      if (!prescription) throw new NotFoundError("Prescription");
      if (!input.patientId) throw new ValidationError("Informe o paciente da receita");
      if (prescription.patientId !== input.patientId) {
        throw new ValidationError("A receita pertence a outro paciente");
      }
      if (prescription.unitId !== input.unitId) {
        throw new AppError("A receita pertence a outra unidade", 422);
      }
      if (prescription.validUntil.getTime() < Date.now()) {
        throw new ValidationError("Receita vencida");
      }
      if (controlled.length > 0) {
        const controlledIds = controlled.map((p) => p!.id);
        if (new Set(controlledIds).size !== controlledIds.length) {
          throw new ValidationError("Medicamento controlado repetido na dispensação; agrupe em um único item");
        }
        const used = await this.dispensations.dispensedByPrescription(prescriptionId);
        if (used.some((u) => controlledIds.includes(u.productId) && u.quantity > 0)) {
          throw new ConflictError("Receita já utilizada para este medicamento");
        }
      }
    }

    return maskDetail(
      await this.dispensations.create({
        unitId: input.unitId,
        userId: input.actor.id,
        patientId: input.patientId ?? null,
        pharmacistId: input.actor.role === "PHARMACIST" ? input.actor.id : null,
        prescriptionId,
        items: input.items,
      }),
    );
  }
}

export class ListDispensationsUseCase {
  constructor(private readonly dispensations: IDispensationRepository) {}

  execute(query: ListDispensationsQuery): Promise<PaginatedDispensations> {
    return this.dispensations.list(query);
  }
}

export class GetDispensationUseCase {
  constructor(private readonly dispensations: IDispensationRepository) {}

  async execute(id: string, unitId?: string): Promise<DispensationDetail> {
    const detail = await this.dispensations.findDetail(id);
    if (!detail || (unitId && detail.unitId !== unitId)) throw new NotFoundError("Dispensation");
    return maskDetail(detail);
  }
}

export class CancelDispensationUseCase {
  constructor(
    private readonly dispensations: IDispensationRepository,
    private readonly users: IUserRepository,
    private readonly notify: NotifyUsersUseCase,
    private readonly templates: IEmailTemplates,
    private readonly webBaseUrl: string,
  ) {}

  async execute(id: string, input: { userId: string; reason: string; unitId?: string }): Promise<DispensationDetail> {
    const existing = await this.dispensations.findById(id);
    if (!existing || (input.unitId && existing.unitId !== input.unitId)) throw new NotFoundError("Dispensation");
    const reason = input.reason.trim();
    if (!reason) throw new ValidationError("Informe o motivo do cancelamento");
    const detail = await this.dispensations.cancel(id, { userId: input.userId, reason });
    await this.notifyManagers(detail, input.userId);
    return maskDetail(detail);
  }

  private async notifyManagers(d: DispensationDetail, actorId: string): Promise<void> {
    try {
      const [recipients, actor] = await Promise.all([
        this.users.listRecipients(d.unitId, ["MANAGER", "PHARMACIST"]),
        this.users.findById(actorId),
      ]);
      const targets = recipients.filter((u) => u.id !== actorId).map((u) => ({ id: u.id, email: u.email }));
      if (targets.length === 0) return;
      const code = d.id.slice(-8).toUpperCase();
      await this.notify.execute({
        recipients: targets,
        type: "SYSTEM",
        email: this.templates.dispensationCanceled({
          code,
          unitName: d.unitName,
          canceledBy: actor?.name ?? "um usuário",
          reason: d.cancelReason ?? "-",
          link: `${this.webBaseUrl}/dispensacoes`,
        }),
        title: `Dispensação ${code} cancelada`,
        body: `Dispensação na unidade ${d.unitName} cancelada por ${actor?.name ?? "um usuário"}. Motivo: ${d.cancelReason ?? "-"}.`,
        link: "/dispensacoes",
      });
    } catch {
      // notificar nunca invalida o cancelamento
    }
  }
}
