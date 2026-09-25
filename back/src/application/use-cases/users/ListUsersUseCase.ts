import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { PublicUser, UserRole, UserStatus } from "../../../domain/entities/User.js";
import { toPublicUser } from "../../../domain/entities/User.js";

export interface ListUsersInput {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export class ListUsersUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: ListUsersInput = {}): Promise<PublicUser[]> {
    const list = await this.users.list(input);
    return list.map(toPublicUser);
  }
}
