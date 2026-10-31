import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../../shared/errors/AppError.js";
import { logger } from "../../../shared/logger.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: "VALIDATION_ERROR",
        message: "Dados da requisição inválidos",
        details: error.flatten(),
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
        details: error.details,
      });
    }

    const status = (error as { statusCode?: number }).statusCode;
    if (typeof status === "number" && status >= 400 && status < 500) {
      const messages: Record<number, string> = {
        400: "Requisição inválida.",
        401: "Não autorizado.",
        403: "Acesso negado.",
        404: "Recurso não encontrado.",
        413: "Corpo da requisição muito grande.",
        415: "Tipo de conteúdo não suportado.",
        429: "Muitas requisições. Tente novamente em instantes.",
      };
      return reply.status(status).send({
        error: status === 429 ? "RATE_LIMITED" : "BAD_REQUEST",
        message: messages[status] ?? "Requisição inválida.",
      });
    }

    logger.error({ err: error, url: request.url }, "Unhandled error");
    return reply.status(500).send({ error: "INTERNAL_ERROR", message: "Erro interno do servidor" });
  });
}
