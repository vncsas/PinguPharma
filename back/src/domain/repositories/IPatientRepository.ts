import type { Patient } from "../entities/Patient.js";

export interface CreatePatientData {
  name: string;
  cns?: string | null;
  cpf?: string | null;
  birthDate?: Date | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  active?: boolean;
}

export type UpdatePatientData = Partial<CreatePatientData>;

export interface ListPatientsQuery {
  /** Nome (parcial), CPF ou CNS (somente dígitos são comparados). */
  search?: string;
  active?: boolean;
  /** Quando true, CPF/CNS só casam com o número completo (igualdade); nome segue por substring. */
  documentExactOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedPatients {
  data: Patient[];
  total: number;
  page: number;
  pageSize: number;
}

/** CPF e CNS são armazenados somente com dígitos; o use case normaliza antes de gravar/consultar. */
export interface IPatientRepository {
  list(query: ListPatientsQuery): Promise<PaginatedPatients>;
  findById(id: string): Promise<Patient | null>;
  findByCpf(cpf: string): Promise<Patient | null>;
  findByCns(cns: string): Promise<Patient | null>;
  create(data: CreatePatientData): Promise<Patient>;
  update(id: string, data: UpdatePatientData): Promise<Patient>;
  delete(id: string): Promise<void>;
}
