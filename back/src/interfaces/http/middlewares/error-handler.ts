import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../../shared/errors/AppError.js";
import { logger } from "../../../shared/logger.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: "VALIDATION_ERROR",
        message: "Invalid request payload",
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

    logger.error({ err: error, url: request.url }, "Unhandled error");
    return reply.status(500).send({ error: "INTERNAL_ERROR", message: "Internal server error" });
  });
}
