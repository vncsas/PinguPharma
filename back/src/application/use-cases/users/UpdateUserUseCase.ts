import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { PublicUser, UserRole, UserStatus } from "../../../domain/entities/User.js";
import { toPublicUser } from "../../../domain/entities/User.js";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

export class UpdateUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError("User");

    if (input.email && input.email.toLowerCase() !== user.email) {
      const other = await this.users.findByEmail(input.email.toLowerCase());
      if (other) throw new ConflictError(`E-mail já cadastrado`);
    }

    const updated = await this.users.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });
    return toPublicUser(updated);
  }
}
