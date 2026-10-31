import type {
  CreatePatientData,
  IPatientRepository,
  ListPatientsQuery,
  UpdatePatientData,
} from "../../../domain/repositories/IPatientRepository.js";
import type { Patient } from "../../../domain/entities/Patient.js";
import type { IDispensationRepository } from "../../../domain/repositories/IDispensationRepository.js";
import type { IPrescriptionRepository } from "../../../domain/repositories/IPrescriptionRepository.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";
import { isValidCns, isValidCpf, maskCns, maskCpf, onlyDigits } from "../../../shared/utils/documents.js";

function mask(p: Patient): Patient {
  return { ...p, cpf: maskCpf(p.cpf), cns: maskCns(p.cns) };
}

function normalizeDocs<T extends { cpf?: string | null; cns?: string | null }>(data: T): T {
  const out = { ...data };
  if (data.cpf !== undefined) {
    const cpf = data.cpf ? onlyDigits(data.cpf) : "";
    if (cpf && !isValidCpf(cpf)) throw new ValidationError("CPF inválido");
    out.cpf = cpf || null;
  }
  if (data.cns !== undefined) {
    const cns = data.cns ? onlyDigits(data.cns) : "";
    if (cns && !isValidCns(cns)) throw new ValidationError("CNS inválido");
    out.cns = cns || null;
  }
  return out;
}

export class ListPatientsUseCase {
  constructor(private readonly patients: IPatientRepository) {}

  async execute(query: ListPatientsQuery) {
    const result = await this.patients.list(query);
    return { ...result, data: result.data.map(mask) };
  }
}

export class GetPatientUseCase {
  constructor(private readonly patients: IPatientRepository) {}

  async execute(id: string): Promise<Patient> {
    const p = await this.patients.findById(id);
    if (!p) throw new NotFoundError("Patient");
    return p;
  }
}

export class CreatePatientUseCase {
  constructor(private readonly patients: IPatientRepository) {}

  async execute(input: CreatePatientData): Promise<Patient> {
    const data = normalizeDocs(input);
    if (!data.cpf && !data.cns) throw new ValidationError("Informe CPF ou CNS");
    await this.assertUnique(data);
    return this.patients.create(data);
  }

  private async assertUnique(data: { cpf?: string | null; cns?: string | null }, ignoreId?: string) {
    if (data.cpf) {
      const other = await this.patients.findByCpf(data.cpf);
      if (other && other.id !== ignoreId) throw new ConflictError("CPF já cadastrado");
    }
    if (data.cns) {
      const other = await this.patients.findByCns(data.cns);
      if (other && other.id !== ignoreId) throw new ConflictError("CNS já cadastrado");
    }
  }
}

export class UpdatePatientUseCase {
  constructor(private readonly patients: IPatientRepository) {}

  async execute(id: string, input: UpdatePatientData): Promise<Patient> {
    const existing = await this.patients.findById(id);
    if (!existing) throw new NotFoundError("Patient");
    const data = normalizeDocs(input);
    const finalCpf = data.cpf !== undefined ? data.cpf : existing.cpf;
    const finalCns = data.cns !== undefined ? data.cns : existing.cns;
    if (!finalCpf && !finalCns) throw new ValidationError("Informe CPF ou CNS");
    if (data.cpf && data.cpf !== existing.cpf) {
      const other = await this.patients.findByCpf(data.cpf);
      if (other && other.id !== id) throw new ConflictError("CPF já cadastrado");
    }
    if (data.cns && data.cns !== existing.cns) {
      const other = await this.patients.findByCns(data.cns);
      if (other && other.id !== id) throw new ConflictError("CNS já cadastrado");
    }
    return this.patients.update(id, data);
  }
}

export class DeletePatientUseCase {
  constructor(
    private readonly patients: IPatientRepository,
    private readonly dispensations: IDispensationRepository,
    private readonly prescriptions: IPrescriptionRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const p = await this.patients.findById(id);
    if (!p) throw new NotFoundError("Patient");
    const [disp, presc] = await Promise.all([
      this.dispensations.list({ patientId: id, page: 1, pageSize: 1 }),
      this.prescriptions.list({ patientId: id, page: 1, pageSize: 1 }),
    ]);
    if (disp.total > 0 || presc.total > 0) {
      throw new ConflictError("Paciente possui dispensações ou receitas e não pode ser excluído; inative o cadastro (PUT active=false)");
    }
    await this.patients.delete(id);
  }
}
