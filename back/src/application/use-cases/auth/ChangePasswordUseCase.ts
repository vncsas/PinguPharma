import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IHasher } from "../../../domain/services/IHasher.js";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../../shared/errors/AppError.js";

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
  ) {}

  async execute(userId: string, input: ChangePasswordInput): Promise<void> {
    if (input.newPassword.length < 8) {
      throw new ValidationError("Senha deve ter ao menos 8 caracteres");
    }
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User");
    const ok = await this.hasher.compare(input.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Senha atual incorreta");
    const passwordHash = await this.hasher.hash(input.newPassword);
    await this.users.update(userId, { passwordHash });
  }
}
