import type { Dispensation, DispensationStatus } from "../entities/Dispensation.js";
import type { ControlledClass } from "../entities/Product.js";

export interface DailyDispensationPoint {
  date: string;
  count: number;
  totalValue: number;
}

export interface ListDispensationsQuery {
  unitId?: string;
  status?: DispensationStatus;
  from?: Date;
  to?: Date;
  userId?: string;
  patientId?: string;
  prescriptionId?: string;
  page?: number;
  pageSize?: number;
}

export interface DispensationListRow extends Dispensation {
  unitName: string;
  userName: string;
  patientName: string | null;
  itemCount: number;
}

export interface PaginatedDispensations {
  data: DispensationListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DispensationItemDetail {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  presentation: string | null;
  measureUnit: string | null;
  controlledClass: ControlledClass;
  batchId: string | null;
  lotNumber: string | null;
  expiresAt: Date | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface DispensationDetail extends Omit<Dispensation, "items"> {
  unitName: string;
  userName: string;
  pharmacistName: string | null;
  patientName: string | null;
  patientCpf: string | null;
  patientCns: string | null;
  prescription: {
    id: string;
    number: string | null;
    prescriberName: string;
    prescriberCouncil: string;
    prescriberCouncilNumber: string;
    issuedAt: Date;
    validUntil: Date;
  } | null;
  items: DispensationItemDetail[];
}

export interface CreateDispensationData {
  unitId: string;
  userId: string;
  patientId?: string | null;
  pharmacistId?: string | null;
  prescriptionId?: string | null;
  items: { productId: string; quantity: number }[];
}

export interface CancelDispensationData {
  userId: string;
  reason: string;
}

export interface IDispensationRepository {
  findById(id: string): Promise<Dispensation | null>;
  findDetail(id: string): Promise<DispensationDetail | null>;
  list(query: ListDispensationsQuery): Promise<PaginatedDispensations>;
  latest(limit: number, unitId?: string): Promise<(Dispensation & { userName: string; patientName: string | null })[]>;
  /** Série diária (zeros preenchidos) de dispensações COMPLETED. */
  countBetween(from: Date, to: Date, unitId?: string): Promise<DailyDispensationPoint[]>;
  countToday(unitId?: string): Promise<{ count: number; totalValue: number }>;
  /** Soma de unidades dispensadas (COMPLETED) do produto ao paciente no período — limite por período. */
  dispensedQuantity(params: { patientId: string; productId: string; from: Date; to?: Date }): Promise<number>;
  /** Unidades já dispensadas (COMPLETED) por produto contra a receita. */
  dispensedByPrescription(prescriptionId: string): Promise<{ productId: string; quantity: number }[]>;
  /**
   * Transacional. Baixa FEFO por lote da unidade (ignora lotes vencidos e sem saldo),
   * grava DispensationItem por lote e StockMovement DISPENSATION (negativo) por lote.
   * Lança ConflictError se produto inativo/estoque insuficiente, NotFoundError se produto/paciente não existir.
   */
  create(data: CreateDispensationData): Promise<DispensationDetail>;
  /**
   * Transacional. Exige motivo; devolve saldo aos lotes e grava DISPENSATION_CANCEL (positivo).
   * Lança ConflictError se já cancelada.
   */
  cancel(id: string, data: CancelDispensationData): Promise<DispensationDetail>;
}
