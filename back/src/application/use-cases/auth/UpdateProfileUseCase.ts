import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { PublicUser } from "../../../domain/entities/User.js";
import { toPublicUser } from "../../../domain/entities/User.js";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export class UpdateProfileUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User");

    if (input.email && input.email.toLowerCase() !== user.email) {
      const other = await this.users.findByEmail(input.email.toLowerCase());
      if (other) throw new ConflictError("E-mail já cadastrado");
    }

    const updated = await this.users.update(userId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
    });
    return toPublicUser(updated);
  }
}
