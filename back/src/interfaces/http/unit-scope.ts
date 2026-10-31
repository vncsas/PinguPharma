import type { FastifyRequest } from "fastify";
import { AppError, ForbiddenError, UnauthorizedError } from "../../shared/errors/AppError.js";

/**
 * ADMIN: usa o header X-Unit-Id (opcional). Demais: sempre a própria unidade (header ignorado).
 */
/** undefined = todas as unidades (somente ADMIN, leituras). */
export function resolveUnitScope(request: FastifyRequest): string | undefined {
  const user = request.user;
  if (!user) throw new UnauthorizedError();
  if (user.role === "ADMIN") {
    const raw = request.headers["x-unit-id"];
    const header = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    return header ? header : undefined;
  }
  if (!user.unitId) throw new ForbiddenError("Usuário sem unidade vinculada");
  return user.unitId;
}

/** Escopo para escrita: exige unidade definida (ADMIN deve enviar X-Unit-Id). */
export function requireUnitScope(request: FastifyRequest): string {
  const unitId = resolveUnitScope(request);
  if (!unitId) throw new AppError("Selecione uma unidade (header X-Unit-Id) para esta operação", 400, "UNIT_REQUIRED");
  return unitId;
}
