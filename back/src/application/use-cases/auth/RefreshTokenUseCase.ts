import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { ITokenService, TokenPair } from "../../../domain/services/ITokenService.js";
import { UnauthorizedError } from "../../../shared/errors/AppError.js";

export class RefreshTokenUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly tokens: ITokenService,
  ) {}

  async execute(refreshToken: string): Promise<TokenPair> {
    const payload = this.tokens.verifyRefresh(refreshToken);
    const user = await this.users.findById(payload.sub);
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedError("Usuário não está mais válido");
    if (typeof payload.tv !== "number" || payload.tv !== user.tokenVersion) {
      throw new UnauthorizedError("Sessão expirada");
    }
    return this.tokens.issuePair({ id: user.id, email: user.email, role: user.role, unitId: user.unitId, tokenVersion: user.tokenVersion });
  }
}
