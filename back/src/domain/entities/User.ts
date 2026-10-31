export type UserRole = "ADMIN" | "MANAGER" | "PHARMACIST" | "DISPENSER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  unitId: string | null;
  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<User, "passwordHash" | "twoFactorSecret" | "tokenVersion">;

export function toPublicUser(u: User): PublicUser {
  const rest: Partial<User> = { ...u };
  delete rest.passwordHash;
  delete rest.twoFactorSecret;
  delete rest.tokenVersion;
  return rest as PublicUser;
}
