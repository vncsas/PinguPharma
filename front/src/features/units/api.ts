import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export type UnitType = "UBS" | "UPA" | "CENTRAL" | "HOSPITAL" | "OTHER";

export const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  UBS: "UBS",
  UPA: "UPA",
  CENTRAL: "Central de abastecimento",
  HOSPITAL: "Hospital",
  OTHER: "Outro",
};

export interface UnitDTO {
  id: string;
  name: string;
  cnes: string | null;
  type: UnitType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnitInput {
  name: string;
  cnes?: string | null;
  type: UnitType;
  active?: boolean;
}

export const unitsApi = {
  list: (params: { search?: string; activeOnly?: boolean } = {}) => {
    const p = new URLSearchParams();
    if (params.search) p.set("search", params.search);
    if (params.activeOnly) p.set("activeOnly", "true");
    const qs = p.toString();
    return apiFetch<{ units: UnitDTO[] }>(`/units${qs ? `?${qs}` : ""}`);
  },
  create: (data: UnitInput) =>
    apiFetch<{ unit: UnitDTO }>("/units", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<UnitInput>) =>
    apiFetch<{ unit: UnitDTO }>(`/units/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

export function useUnits(params: { search?: string; activeOnly?: boolean } = {}, enabled = true) {
  return useQuery({
    queryKey: ["units", params],
    queryFn: () => unitsApi.list(params),
    staleTime: 60_000,
    enabled,
  });
}
