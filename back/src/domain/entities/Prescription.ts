export type PrescriberCouncil = "CRM" | "CRO" | "COREN" | "OTHER";

export interface Prescription {
  id: string;
  patientId: string;
  unitId: string;
  prescriberName: string;
  prescriberCouncil: PrescriberCouncil;
  prescriberCouncilNumber: string;
  number: string | null;
  issuedAt: Date;
  validUntil: Date;
  retained: boolean;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface PrescriptionDetail extends Prescription {
  patientName: string;
  unitName: string;
  createdByName: string;
}
