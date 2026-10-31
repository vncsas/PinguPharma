export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code: string = "APP_ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, 403, "FORBIDDEN");
  }
}

const ENTITY_LABELS: Record<string, { name: string; feminine: boolean }> = {
  Batch: { name: "Lote", feminine: false },
  Lote: { name: "Lote", feminine: false },
  Dispensation: { name: "Dispensação", feminine: true },
  Dispensação: { name: "Dispensação", feminine: true },
  Notification: { name: "Notificação", feminine: true },
  Patient: { name: "Paciente", feminine: false },
  Paciente: { name: "Paciente", feminine: false },
  Prescription: { name: "Receita", feminine: true },
  Product: { name: "Medicamento", feminine: false },
  Medicamento: { name: "Medicamento", feminine: false },
  Supplier: { name: "Fornecedor", feminine: false },
  Transfer: { name: "Transferência", feminine: true },
  Transferência: { name: "Transferência", feminine: true },
  Unit: { name: "Unidade", feminine: true },
  Unidade: { name: "Unidade", feminine: true },
  User: { name: "Usuário", feminine: false },
};

export class NotFoundError extends AppError {
  constructor(entity = "Recurso") {
    const label = ENTITY_LABELS[entity] ?? { name: entity, feminine: false };
    super(`${label.name} ${label.feminine ? "não encontrada" : "não encontrado"}`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

export class TwoFactorRequiredError extends AppError {
  constructor(public readonly challengeToken: string) {
    super("Autenticação em dois fatores obrigatória", 401, "TWOFA_REQUIRED", { challengeToken });
  }
}
