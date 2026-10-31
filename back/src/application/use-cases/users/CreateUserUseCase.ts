import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IHasher } from "../../../domain/services/IHasher.js";
import type { PublicUser, UserRole, UserStatus } from "../../../domain/entities/User.js";
import { toPublicUser } from "../../../domain/entities/User.js";
import type { ITokenService } from "../../../domain/services/ITokenService.js";
import type { IMailer } from "../../../domain/services/IMailer.js";
import type { IEmailTemplates } from "../../../domain/services/IEmailTemplates.js";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepository.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  unitId?: string | null;
}

export class CreateUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
    private readonly tokens: ITokenService,
    private readonly mailer: IMailer,
    private readonly templates: IEmailTemplates,
    private readonly webBaseUrl: string,
    private readonly units: IUnitRepository,
  ) {}

  async execute(input: CreateUserInput): Promise<PublicUser> {
    const email = input.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictError(`E-mail '${email}' já cadastrado`);

    const unitId = input.unitId ?? null;
    if (input.role !== "ADMIN" && !unitId) throw new ValidationError("Unidade é obrigatória para este perfil");
    if (unitId && !(await this.units.findById(unitId))) throw new NotFoundError("Unit");

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({
      name: input.name,
      email,
      passwordHash,
      role: input.role,
      status: input.status ?? "ACTIVE",
      unitId,
    });
    const validHours = 72;
    const token = this.tokens.signPasswordReset({ sub: user.id, tv: user.tokenVersion }, `${validHours}h`);
    await this.mailer.send({
      to: user.email,
      ...this.templates.welcome({
        name: user.name,
        email: user.email,
        setPasswordLink: `${this.webBaseUrl}/redefinir-senha?token=${encodeURIComponent(token)}`,
        validHours,
      }),
    });
    return toPublicUser(user);
  }
}
