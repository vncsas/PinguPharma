import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { ITokenService, TokenPair } from "../../../domain/services/ITokenService.js";
import type { ITwoFactorService } from "../../../domain/services/ITwoFactorService.js";
import type { PublicUser } from "../../../domain/entities/User.js";
import { toPublicUser } from "../../../domain/entities/User.js";
import { UnauthorizedError } from "../../../shared/errors/AppError.js";

export interface Verify2FAInput {
  challengeToken: string;
  code: string;
}

export interface Verify2FAOutput {
  user: PublicUser;
  tokens: TokenPair;
}

export class Verify2FAUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly tokens: ITokenService,
    private readonly twofa: ITwoFactorService,
  ) {}

  async execute(input: Verify2FAInput): Promise<Verify2FAOutput> {
    const payload = this.tokens.verifyChallenge(input.challengeToken);
    const user = await this.users.findById(payload.sub);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedError("2FA não está ativado");
    }
    const ok = this.twofa.verify(user.twoFactorSecret, input.code);
    if (!ok) throw new UnauthorizedError("Código 2FA inválido");

    await this.users.update(user.id, { lastLoginAt: new Date() });
    const tokens = this.tokens.issuePair({ id: user.id, email: user.email, role: user.role, unitId: user.unitId, tokenVersion: user.tokenVersion });
    return { user: toPublicUser(user), tokens };
  }
}
