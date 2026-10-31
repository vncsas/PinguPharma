import jwt, { type SignOptions } from "jsonwebtoken";
import type {
  AccessTokenPayload,
  ChallengeTokenPayload,
  ITokenService,
  PasswordResetTokenPayload,
  RefreshTokenPayload,
  TokenPair,
} from "../../domain/services/ITokenService.js";
import type { UserRole } from "../../domain/entities/User.js";
import { UnauthorizedError } from "../../shared/errors/AppError.js";

export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly accessTtl: string,
    private readonly refreshTtl: string,
  ) {}

  signAccess(payload: Omit<AccessTokenPayload, "type">): string {
    return jwt.sign({ ...payload, type: "access" }, this.secret, { expiresIn: this.accessTtl as SignOptions["expiresIn"] });
  }

  signRefresh(payload: Omit<RefreshTokenPayload, "type">): string {
    return jwt.sign({ ...payload, type: "refresh" }, this.secret, { expiresIn: this.refreshTtl as SignOptions["expiresIn"] });
  }

  signChallenge(payload: Omit<ChallengeTokenPayload, "type">): string {
    return jwt.sign({ ...payload, type: "2fa-challenge" }, this.secret, { expiresIn: "5m" });
  }

  signPasswordReset(payload: Omit<PasswordResetTokenPayload, "type">, ttl: string = "5m"): string {
    return jwt.sign({ ...payload, type: "pwd-reset" }, this.secret, { expiresIn: ttl as SignOptions["expiresIn"] });
  }

  verifyAccess(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as AccessTokenPayload;
      if (decoded.type !== "access") throw new Error("wrong-type");
      return decoded;
    } catch {
      throw new UnauthorizedError("Token de acesso inválido ou expirado");
    }
  }

  verifyRefresh(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as RefreshTokenPayload;
      if (decoded.type !== "refresh") throw new Error("wrong-type");
      return decoded;
    } catch {
      throw new UnauthorizedError("Token de renovação inválido ou expirado");
    }
  }

  verifyChallenge(token: string): ChallengeTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as ChallengeTokenPayload;
      if (decoded.type !== "2fa-challenge") throw new Error("wrong-type");
      return decoded;
    } catch {
      throw new UnauthorizedError("Invalid or expired 2FA challenge");
    }
  }

  verifyPasswordReset(token: string): PasswordResetTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as PasswordResetTokenPayload;
      if (decoded.type !== "pwd-reset") throw new Error("wrong-type");
      return decoded;
    } catch {
      throw new UnauthorizedError("Token de redefinição inválido ou expirado");
    }
  }

  issuePair(user: { id: string; email: string; role: UserRole; unitId: string | null; tokenVersion: number }): TokenPair {
    const accessToken = this.signAccess({ sub: user.id, email: user.email, role: user.role, unit: user.unitId, tv: user.tokenVersion });
    const refreshToken = this.signRefresh({ sub: user.id, tv: user.tokenVersion });
    const decoded = jwt.decode(accessToken) as { exp: number; iat: number };
    return { accessToken, refreshToken, expiresIn: decoded.exp - decoded.iat };
  }
}
