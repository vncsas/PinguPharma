import type { User, UserRole, UserStatus } from "../entities/User.js";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  status?: UserStatus;
  unitId?: string | null;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  status?: UserStatus;
  unitId?: string | null;
  twoFactorSecret?: string | null;
  twoFactorEnabled?: boolean;
  lastLoginAt?: Date;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(params?: { search?: string; role?: UserRole; status?: UserStatus; unitId?: string }): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
  /** Usuários ACTIVE destinatários de alertas: todos os ADMIN + usuários da unidade com um dos perfis. */
  listRecipients(unitId: string, roles: UserRole[]): Promise<User[]>;
  incrementTokenVersion(userId: string): Promise<number>;
}
