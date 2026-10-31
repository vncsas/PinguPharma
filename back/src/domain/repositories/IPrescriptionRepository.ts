import type {
  Prescription,
  PrescriberCouncil,
  PrescriptionDetail,
} from "../entities/Prescription.js";

export interface CreatePrescriptionData {
  patientId: string;
  unitId: string;
  prescriberName: string;
  prescriberCouncil: PrescriberCouncil;
  prescriberCouncilNumber: string;
  number?: string | null;
  issuedAt: Date;
  validUntil: Date;
  retained?: boolean;
  notes?: string | null;
  createdBy: string;
}

export interface ListPrescriptionsQuery {
  unitId?: string;
  patientId?: string;
  /** Somente receitas com validUntil >= agora. */
  validOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedPrescriptions {
  data: PrescriptionDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IPrescriptionRepository {
  create(data: CreatePrescriptionData): Promise<Prescription>;
  findById(id: string): Promise<PrescriptionDetail | null>;
  list(query: ListPrescriptionsQuery): Promise<PaginatedPrescriptions>;
}
