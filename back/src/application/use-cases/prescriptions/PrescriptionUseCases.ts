import type {
  CreatePrescriptionData,
  IPrescriptionRepository,
  ListPrescriptionsQuery,
  PaginatedPrescriptions,
} from "../../../domain/repositories/IPrescriptionRepository.js";
import type { IPatientRepository } from "../../../domain/repositories/IPatientRepository.js";
import type { Prescription, PrescriptionDetail } from "../../../domain/entities/Prescription.js";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepository.js";
import { AppError, NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";

export class CreatePrescriptionUseCase {
  constructor(
    private readonly prescriptions: IPrescriptionRepository,
    private readonly patients: IPatientRepository,
    private readonly units: IUnitRepository,
  ) {}

  async execute(data: CreatePrescriptionData): Promise<Prescription> {
    const patient = await this.patients.findById(data.patientId);
    if (!patient) throw new NotFoundError("Patient");
    if (!patient.active) throw new AppError("Paciente inativo não pode receber receitas", 422);
    const unit = await this.units.findById(data.unitId);
    if (!unit) throw new NotFoundError("Unit");
    if (!unit.active) throw new AppError("Unidade inativa não pode registrar receitas", 422);
    if (data.validUntil.getTime() < data.issuedAt.getTime()) {
      throw new ValidationError("A validade da receita não pode ser anterior à emissão");
    }
    return this.prescriptions.create(data);
  }
}

export class ListPrescriptionsUseCase {
  constructor(private readonly prescriptions: IPrescriptionRepository) {}

  execute(query: ListPrescriptionsQuery): Promise<PaginatedPrescriptions> {
    return this.prescriptions.list(query);
  }
}

export class GetPrescriptionUseCase {
  constructor(private readonly prescriptions: IPrescriptionRepository) {}

  async execute(id: string, unitId?: string): Promise<PrescriptionDetail> {
    const p = await this.prescriptions.findById(id);
    if (!p || (unitId && p.unitId !== unitId)) throw new NotFoundError("Prescription");
    return p;
  }
}
