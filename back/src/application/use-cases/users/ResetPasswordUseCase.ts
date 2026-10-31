import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IHasher } from "../../../domain/services/IHasher.js";
import type { IMailer } from "../../../domain/services/IMailer.js";
import type { IEmailTemplates } from "../../../domain/services/IEmailTemplates.js";
import type { NotifyUsersUseCase } from "../notifications/NotifyUsersUseCase.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";

export class ResetPasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
    private readonly mailer: IMailer,
    private readonly templates: IEmailTemplates,
    private readonly notify: NotifyUsersUseCase,
    private readonly webBaseUrl: string,
  ) {}

  async execute(userId: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) throw new ValidationError("Senha deve ter ao menos 8 caracteres");
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User");
    const passwordHash = await this.hasher.hash(newPassword);
    await this.users.update(userId, { passwordHash });
    await this.users.incrementTokenVersion(userId);
    await this.mailer.send({
      to: user.email,
      ...this.templates.passwordResetByAdmin({ name: user.name, loginLink: `${this.webBaseUrl}/login` }),
    });
    await this.notify.execute({
      recipients: [{ id: user.id, email: user.email }],
      type: "SECURITY",
      title: "Senha redefinida por um administrador",
      body: "Sua senha foi redefinida por um administrador. Altere-a no seu perfil.",
      link: "/perfil",
    });
  }
}
