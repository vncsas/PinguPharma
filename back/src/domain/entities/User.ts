export type UserRole = "ADMIN" | "MANAGER" | "SELLER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<User, "passwordHash" | "twoFactorSecret">;

export function toPublicUser(u: User): PublicUser {
  const { passwordHash: _p, twoFactorSecret: _s, ...rest } = u;
  return rest;
}
