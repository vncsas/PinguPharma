import type { Role } from "@/features/auth/types";
import type { UserStatus } from "./api";

export const ROLES: Role[] = ["ADMIN", "MANAGER", "SELLER"];
export const STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE", "BLOCKED"];

export const roleLabel: Record<Role, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  SELLER: "Vendedor",
};

export const statusLabel: Record<UserStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  BLOCKED: "Bloqueado",
};
