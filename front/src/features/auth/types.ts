export type Role = "ADMIN" | "MANAGER" | "SELLER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  twoFactorEnabled: boolean;
}
