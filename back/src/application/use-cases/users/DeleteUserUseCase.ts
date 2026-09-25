import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";

export class DeleteUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(id: string, requesterId: string): Promise<void> {
    if (id === requesterId) throw new ConflictError("Não é possível excluir o próprio usuário");
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError("User");
    await this.users.delete(id);
  }
}
