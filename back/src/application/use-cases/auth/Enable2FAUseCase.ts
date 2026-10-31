import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { ITwoFactorService, TwoFactorSetup } from "../../../domain/services/ITwoFactorService.js";
import type { IHasher } from "../../../domain/services/IHasher.js";
import type { IMailer } from "../../../domain/services/IMailer.js";
import type { IEmailTemplates } from "../../../domain/services/IEmailTemplates.js";
import type { NotifyUsersUseCase } from "../notifications/NotifyUsersUseCase.js";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../../shared/errors/AppError.js";

export interface Enable2FAInput {
  userId: string;
  code?: string;
  confirm: boolean;
}

export type Enable2FAOutput =
  | { status: "SETUP"; setup: TwoFactorSetup }
  | { status: "CONFIRMED" };

export class Enable2FAUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly twofa: ITwoFactorService,
    private readonly mailer: IMailer,
    private readonly templates: IEmailTemplates,
    private readonly notify: NotifyUsersUseCase,
    private readonly hasher: IHasher,
  ) {}

  async execute(input: Enable2FAInput): Promise<Enable2FAOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError("User");

    if (!input.confirm) {
      const setup = await this.twofa.generateSecret(user.email);
      await this.users.update(user.id, { twoFactorSecret: setup.secret, twoFactorEnabled: false });
      return { status: "SETUP", setup };
    }

    if (!input.code) throw new ValidationError("Informe o código de confirmação");
    if (!user.twoFactorSecret) throw new ValidationError("Configuração de 2FA não iniciada");
    const ok = this.twofa.verify(user.twoFactorSecret, input.code);
    if (!ok) throw new ValidationError("Código de confirmação inválido");
    await this.users.update(user.id, { twoFactorEnabled: true });
    await this.notifyChange(user, true);
    return { status: "CONFIRMED" };
  }

  async disable(userId: string, password: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User");
    const ok = await this.hasher.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Senha incorreta");
    await this.users.update(user.id, { twoFactorSecret: null, twoFactorEnabled: false });
    await this.notifyChange(user, false);
  }

  private async notifyChange(user: { id: string; email: string; name: string }, enabled: boolean): Promise<void> {
    const state = enabled ? "ativada" : "desativada";
    await this.mailer.send({
      to: user.email,
      ...this.templates.twoFactorChanged({ name: user.name, enabled }),
    });
    await this.notify.execute({
      recipients: [{ id: user.id, email: user.email }],
      type: "SECURITY",
      title: `Verificação em duas etapas ${state}`,
      body: `A verificação em duas etapas da sua conta foi ${state}.`,
      link: "/perfil",
    });
  }
}
