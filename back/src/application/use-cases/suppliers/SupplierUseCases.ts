import type {
  CreateSupplierData,
  ISupplierRepository,
  UpdateSupplierData,
} from "../../../domain/repositories/ISupplierRepository.js";
import type { Supplier } from "../../../domain/entities/Supplier.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";
import { onlyDigits } from "../../../shared/utils/documents.js";

function normalizeCnpj(cnpj: string | null | undefined): string | null | undefined {
  if (cnpj === undefined || cnpj === null) return cnpj;
  const digits = onlyDigits(cnpj);
  if (digits.length === 0) return null;
  if (digits.length !== 14) throw new ValidationError("CNPJ deve ter 14 dígitos");
  return digits;
}

export class ListSuppliersUseCase {
  constructor(private readonly suppliers: ISupplierRepository) {}

  execute(params: { search?: string; activeOnly?: boolean } = {}): Promise<Supplier[]> {
    return this.suppliers.list(params);
  }
}

export class CreateSupplierUseCase {
  constructor(private readonly suppliers: ISupplierRepository) {}

  async execute(data: CreateSupplierData): Promise<Supplier> {
    const cnpj = normalizeCnpj(data.cnpj);
    if (cnpj && (await this.suppliers.findByCnpj(cnpj))) throw new ConflictError("CNPJ já cadastrado");
    return this.suppliers.create({ ...data, cnpj: cnpj ?? null });
  }
}

export class UpdateSupplierUseCase {
  constructor(private readonly suppliers: ISupplierRepository) {}

  async execute(id: string, data: UpdateSupplierData): Promise<Supplier> {
    const existing = await this.suppliers.findById(id);
    if (!existing) throw new NotFoundError("Supplier");
    const cnpj = normalizeCnpj(data.cnpj);
    if (cnpj && cnpj !== existing.cnpj) {
      const other = await this.suppliers.findByCnpj(cnpj);
      if (other && other.id !== id) throw new ConflictError("CNPJ já cadastrado");
    }
    return this.suppliers.update(id, { ...data, ...(cnpj !== undefined ? { cnpj } : {}) });
  }
}
