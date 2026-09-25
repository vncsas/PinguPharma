import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IHasher } from "../../../domain/services/IHasher.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";

export class ResetPasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
  ) {}

  async execute(userId: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) throw new ValidationError("Senha deve ter ao menos 8 caracteres");
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User");
    const passwordHash = await this.hasher.hash(newPassword);
    await this.users.update(userId, { passwordHash });
  }
}
