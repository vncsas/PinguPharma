import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { ITokenService, TokenPair } from "../../../domain/services/ITokenService.js";
import type { IHasher } from "../../../domain/services/IHasher.js";
import type { IMailer } from "../../../domain/services/IMailer.js";
import type { IEmailTemplates } from "../../../domain/services/IEmailTemplates.js";
import type { NotifyUsersUseCase } from "../notifications/NotifyUsersUseCase.js";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../../shared/errors/AppError.js";

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
    private readonly mailer: IMailer,
    private readonly templates: IEmailTemplates,
    private readonly notify: NotifyUsersUseCase,
    private readonly webBaseUrl: string,
    private readonly tokens: ITokenService,
  ) {}

  async execute(userId: string, input: ChangePasswordInput): Promise<TokenPair> {
    if (input.newPassword.length < 8) {
      throw new ValidationError("Senha deve ter ao menos 8 caracteres");
    }
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User");
    const ok = await this.hasher.compare(input.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Senha atual incorreta");
    const passwordHash = await this.hasher.hash(input.newPassword);
    await this.users.update(userId, { passwordHash });
    const tokenVersion = await this.users.incrementTokenVersion(userId);
    await this.mailer.send({
      to: user.email,
      ...this.templates.passwordChanged({ name: user.name, loginLink: `${this.webBaseUrl}/login` }),
    });
    await this.notify.execute({
      recipients: [{ id: user.id, email: user.email }],
      type: "SECURITY",
      title: "Senha alterada",
      body: "A senha da sua conta foi alterada. Se não foi você, avise a administração.",
      link: "/perfil",
    });
    return this.tokens.issuePair({ id: user.id, email: user.email, role: user.role, unitId: user.unitId, tokenVersion });
  }
}
