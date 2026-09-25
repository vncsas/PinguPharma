import type { UserRole } from "../entities/User.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
}

export interface ChallengeTokenPayload {
  sub: string;
  type: "2fa-challenge";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ITokenService {
  signAccess(payload: Omit<AccessTokenPayload, "type">): string;
  signRefresh(payload: Omit<RefreshTokenPayload, "type">): string;
  signChallenge(payload: Omit<ChallengeTokenPayload, "type">): string;
  verifyAccess(token: string): AccessTokenPayload;
  verifyRefresh(token: string): RefreshTokenPayload;
  verifyChallenge(token: string): ChallengeTokenPayload;
  issuePair(user: { id: string; email: string; role: UserRole }): TokenPair;
}
