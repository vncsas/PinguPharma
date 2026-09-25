import jwt from "jsonwebtoken";
import type {
  AccessTokenPayload,
  ChallengeTokenPayload,
  ITokenService,
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
    return jwt.sign({ ...payload, type: "access" }, this.secret, { expiresIn: this.accessTtl });
  }

  signRefresh(payload: Omit<RefreshTokenPayload, "type">): string {
    return jwt.sign({ ...payload, type: "refresh" }, this.secret, { expiresIn: this.refreshTtl });
  }

  signChallenge(payload: Omit<ChallengeTokenPayload, "type">): string {
    return jwt.sign({ ...payload, type: "2fa-challenge" }, this.secret, { expiresIn: "5m" });
  }

  verifyAccess(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as AccessTokenPayload;
      if (decoded.type !== "access") throw new Error("wrong-type");
      return decoded;
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }
  }

  verifyRefresh(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as RefreshTokenPayload;
      if (decoded.type !== "refresh") throw new Error("wrong-type");
      return decoded;
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
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

  issuePair(user: { id: string; email: string; role: UserRole }): TokenPair {
    const accessToken = this.signAccess({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = this.signRefresh({ sub: user.id });
    const decoded = jwt.decode(accessToken) as { exp: number; iat: number };
    return { accessToken, refreshToken, expiresIn: decoded.exp - decoded.iat };
  }
}
