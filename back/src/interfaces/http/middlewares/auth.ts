import type { FastifyReply, FastifyRequest } from "fastify";
import type { AccessTokenPayload, ITokenService } from "../../../domain/services/ITokenService.js";
import { ForbiddenError, UnauthorizedError } from "../../../shared/errors/AppError.js";
import type { UserRole } from "../../../domain/entities/User.js";

declare module "fastify" {
  interface FastifyRequest {
    currentUser?: AccessTokenPayload;
  }
}

export function createAuthMiddleware(tokens: ITokenService) {
  return async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing bearer token");
    }
    const token = header.slice("Bearer ".length);
    request.currentUser = tokens.verifyAccess(token);
  };
}

export function requireRole(...roles: UserRole[]) {
  return async function guard(request: FastifyRequest) {
    if (!request.currentUser) throw new UnauthorizedError();
    if (!roles.includes(request.currentUser.role)) {
      throw new ForbiddenError(`Requires role: ${roles.join(", ")}`);
    }
  };
}
