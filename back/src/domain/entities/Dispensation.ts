export type DispensationStatus = "COMPLETED" | "CANCELED";

export interface DispensationItem {
  id: string;
  dispensationId: string;
  productId: string;
  batchId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Dispensation {
  id: string;
  unitId: string;
  userId: string;
  patientId: string | null;
  pharmacistId: string | null;
  prescriptionId: string | null;
  totalValue: number;
  status: DispensationStatus;
  cancelReason: string | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items?: DispensationItem[];
}
