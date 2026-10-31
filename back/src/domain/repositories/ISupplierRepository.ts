import type { Supplier, SupplierType } from "../entities/Supplier.js";

export interface CreateSupplierData {
  name: string;
  cnpj?: string | null;
  type: SupplierType;
  active?: boolean;
}

export interface UpdateSupplierData {
  name?: string;
  cnpj?: string | null;
  type?: SupplierType;
  active?: boolean;
}

export interface ISupplierRepository {
  list(params?: { search?: string; activeOnly?: boolean }): Promise<Supplier[]>;
  findById(id: string): Promise<Supplier | null>;
  findByCnpj(cnpj: string): Promise<Supplier | null>;
  create(data: CreateSupplierData): Promise<Supplier>;
  update(id: string, data: UpdateSupplierData): Promise<Supplier>;
}
