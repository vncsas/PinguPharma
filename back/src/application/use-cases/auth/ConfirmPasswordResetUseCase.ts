import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IHasher } from "../../../domain/services/IHasher.js";
import type { ITokenService } from "../../../domain/services/ITokenService.js";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../../shared/errors/AppError.js";

export interface ConfirmPasswordResetInput {
  token: string;
  password: string;
}

export class ConfirmPasswordResetUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly tokens: ITokenService,
    private readonly hasher: IHasher,
  ) {}

  async execute(input: ConfirmPasswordResetInput): Promise<void> {
    if (input.password.length < 8) throw new ValidationError("Senha deve ter ao menos 8 caracteres");
    let payload;
    try {
      payload = this.tokens.verifyChallenge(input.token);
    } catch {
      throw new UnauthorizedError("Token inválido ou expirado");
    }
    const user = await this.users.findById(payload.sub);
    if (!user) throw new NotFoundError("User");
    const passwordHash = await this.hasher.hash(input.password);
    await this.users.update(user.id, { passwordHash });
  }
}
