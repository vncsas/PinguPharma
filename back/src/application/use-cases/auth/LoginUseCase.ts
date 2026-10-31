import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IHasher } from "../../../domain/services/IHasher.js";
import type { ITokenService, TokenPair } from "../../../domain/services/ITokenService.js";
import type { PublicUser } from "../../../domain/entities/User.js";
import { toPublicUser } from "../../../domain/entities/User.js";
import {
  ForbiddenError,
  TwoFactorRequiredError,
  UnauthorizedError,
} from "../../../shared/errors/AppError.js";

export interface LoginInput {
  email: string;
  password: string;
}

export type LoginOutput =
  | { status: "AUTHENTICATED"; user: PublicUser; tokens: TokenPair }
  | { status: "TWOFA_REQUIRED"; challengeToken: string };

export class LoginUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
    private readonly tokens: ITokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    if (!user) throw new UnauthorizedError("Credenciais inválidas");

    const ok = await this.hasher.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Credenciais inválidas");

    if (user.status !== "ACTIVE") {
      throw new ForbiddenError("Usuário inativo");
    }

    if (user.twoFactorEnabled) {
      const challengeToken = this.tokens.signChallenge({ sub: user.id });
      throw new TwoFactorRequiredError(challengeToken);
    }

    await this.users.update(user.id, { lastLoginAt: new Date() });
    const tokens = this.tokens.issuePair({ id: user.id, email: user.email, role: user.role, unitId: user.unitId, tokenVersion: user.tokenVersion });
    return { status: "AUTHENTICATED", user: toPublicUser(user), tokens };
  }
}
