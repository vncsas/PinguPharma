import type { Role } from "@/features/auth/types";
import type { UserStatus } from "./api";

export const ROLES = ["ADMIN", "MANAGER", "SELLER"] as const satisfies readonly Role[];
export const STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"] as const satisfies readonly UserStatus[];

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

export const roleOptions = ROLES.map((r) => ({ value: r, label: roleLabel[r] }));
export const statusOptions = STATUSES.map((s) => ({ value: s, label: statusLabel[s] }));
