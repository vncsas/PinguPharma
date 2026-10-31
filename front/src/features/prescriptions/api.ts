import { apiFetch } from "@/lib/api-client";

export type PrescriberCouncil = "CRM" | "CRO" | "COREN" | "OTHER";

export const COUNCIL_LABEL: Record<PrescriberCouncil, string> = {
  CRM: "CRM",
  CRO: "CRO",
  COREN: "COREN",
  OTHER: "Outro",
};

export interface PrescriptionDTO {
  id: string;
  patientId: string;
  patientName: string;
  unitId: string;
  unitName: string;
  prescriberName: string;
  prescriberCouncil: PrescriberCouncil;
  prescriberCouncilNumber: string;
  number: string | null;
  issuedAt: string;
  validUntil: string;
  retained: boolean;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface PrescriptionListResponse {
  data: PrescriptionDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PrescriptionInput {
  patientId: string;
  prescriberName: string;
  prescriberCouncil: PrescriberCouncil;
  prescriberCouncilNumber: string;
  number?: string | null;
  issuedAt: string;
  validUntil: string;
  retained?: boolean;
  notes?: string | null;
}

export interface PrescriptionFilters {
  patientId?: string;
  validOnly?: boolean;
  page?: number;
  pageSize?: number;
}

function toQuery(f: PrescriptionFilters) {
  const p = new URLSearchParams();
  if (f.patientId) p.set("patientId", f.patientId);
  if (f.validOnly !== undefined) p.set("validOnly", String(f.validOnly));
  if (f.page) p.set("page", String(f.page));
  if (f.pageSize) p.set("pageSize", String(f.pageSize));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const prescriptionsApi = {
  list: (f: PrescriptionFilters = {}) => apiFetch<PrescriptionListResponse>(`/prescriptions${toQuery(f)}`),
  get: (id: string) => apiFetch<{ prescription: PrescriptionDTO }>(`/prescriptions/${id}`),
  create: (data: PrescriptionInput) =>
    apiFetch<{ prescription: PrescriptionDTO }>("/prescriptions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export function isPrescriptionValid(p: { validUntil: string }) {
  return new Date(p.validUntil).getTime() >= Date.now();
}
