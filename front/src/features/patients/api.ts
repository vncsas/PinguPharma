import { apiFetch } from "@/lib/api-client";

export interface PatientDTO {
  id: string;
  name: string;
  /** Mascarado nas listagens; completo apenas em GET por id. */
  cns: string | null;
  cpf: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientListResponse {
  data: PatientDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PatientInput {
  name: string;
  cpf?: string | null;
  cns?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  active?: boolean;
}

export interface PatientFilters {
  search?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

function toQuery(f: PatientFilters) {
  const p = new URLSearchParams();
  if (f.search) p.set("search", f.search);
  if (f.active !== undefined) p.set("active", String(f.active));
  if (f.page) p.set("page", String(f.page));
  if (f.pageSize) p.set("pageSize", String(f.pageSize));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const patientsApi = {
  list: (f: PatientFilters = {}) => apiFetch<PatientListResponse>(`/patients${toQuery(f)}`),
  get: (id: string) => apiFetch<{ patient: PatientDTO }>(`/patients/${id}`),
  create: (data: PatientInput) =>
    apiFetch<{ patient: PatientDTO }>("/patients", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<PatientInput>) =>
    apiFetch<{ patient: PatientDTO }>(`/patients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/patients/${id}`, { method: "DELETE" }),
};
