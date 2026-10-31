import type { FastifyRequest } from "fastify";
import type { AccessTokenPayload, ITokenService } from "../../../domain/services/ITokenService.js";
import { ForbiddenError, UnauthorizedError } from "../../../shared/errors/AppError.js";
import type { ISessionValidator } from "../../../domain/services/ISessionValidator.js";
import type { UserRole } from "../../../domain/entities/User.js";

export interface AuthUser {
  id: string;
  role: UserRole;
  unitId: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    currentUser?: AccessTokenPayload;
    user?: AuthUser;
  }
}

export function createAuthMiddleware(tokens: ITokenService, sessions: ISessionValidator) {
  return async function authenticate(request: FastifyRequest) {
    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token de acesso ausente");
    }
    const token = header.slice("Bearer ".length);
    const payload = tokens.verifyAccess(token);
    await sessions.assertValid(payload.sub, payload.tv);
    request.currentUser = payload;
    request.user = { id: payload.sub, role: payload.role, unitId: payload.unit ?? null };
  };
}

export function requireRole(...roles: UserRole[]) {
  return async function guard(request: FastifyRequest) {
    if (!request.user) throw new UnauthorizedError();
    if (!roles.includes(request.user.role)) {
      throw new ForbiddenError(`Perfil necessário: ${roles.join(", ")}`);
    }
  };
}
