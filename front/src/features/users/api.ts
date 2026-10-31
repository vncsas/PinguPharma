import { apiFetch } from "@/lib/api-client";

export type Role = "ADMIN" | "MANAGER" | "PHARMACIST" | "DISPENSER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  unitId: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  search?: string;
  role?: Role;
  status?: UserStatus;
  unitId?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  status?: UserStatus;
  unitId?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  status?: UserStatus;
  unitId?: string | null;
}

function toQuery(f: UserFilters) {
  const p = new URLSearchParams();
  if (f.search) p.set("search", f.search);
  if (f.role) p.set("role", f.role);
  if (f.status) p.set("status", f.status);
  if (f.unitId) p.set("unitId", f.unitId);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const usersApi = {
  list: (f: UserFilters = {}) => apiFetch<{ users: UserDTO[] }>(`/users${toQuery(f)}`),
  create: (data: CreateUserInput) =>
    apiFetch<{ user: UserDTO }>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateUserInput) =>
    apiFetch<{ user: UserDTO }>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  resetPassword: (id: string, password: string) =>
    apiFetch<void>(`/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  remove: (id: string) => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
};
