import type { UserRole } from "../entities/User.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  unit: string | null;
  tv: number;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  tv: number;
  type: "refresh";
}

export interface ChallengeTokenPayload {
  sub: string;
  type: "2fa-challenge";
}

export interface PasswordResetTokenPayload {
  sub: string;
  tv: number;
  type: "pwd-reset";
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
  signPasswordReset(payload: Omit<PasswordResetTokenPayload, "type">, ttl?: string): string;
  verifyAccess(token: string): AccessTokenPayload;
  verifyRefresh(token: string): RefreshTokenPayload;
  verifyChallenge(token: string): ChallengeTokenPayload;
  verifyPasswordReset(token: string): PasswordResetTokenPayload;
  issuePair(user: { id: string; email: string; role: UserRole; unitId: string | null; tokenVersion: number }): TokenPair;
}
