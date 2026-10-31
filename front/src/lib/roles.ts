import type { Role } from "./auth-context";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gestor da unidade",
  PHARMACIST: "Farmacêutico",
  DISPENSER: "Atendente",
};

export const ALL_ROLES: Role[] = ["ADMIN", "MANAGER", "PHARMACIST", "DISPENSER"];
/** ADMIN, MANAGER e PHARMACIST: estoque, histórico, relatórios. */
export const STAFF_ROLES: Role[] = ["ADMIN", "MANAGER", "PHARMACIST"];
/** Escrita no catálogo de produtos e fornecedores. */
export const MANAGER_ROLES: Role[] = ["ADMIN", "MANAGER"];
export const ADMIN_ROLES: Role[] = ["ADMIN"];
