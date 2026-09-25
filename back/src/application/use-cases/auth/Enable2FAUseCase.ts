import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { ITwoFactorService, TwoFactorSetup } from "../../../domain/services/ITwoFactorService.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";

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
  ) {}

  async execute(input: Enable2FAInput): Promise<Enable2FAOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError("User");

    if (!input.confirm) {
      const setup = await this.twofa.generateSecret(user.email);
      await this.users.update(user.id, { twoFactorSecret: setup.secret, twoFactorEnabled: false });
      return { status: "SETUP", setup };
    }

    if (!input.code) throw new ValidationError("Missing code for confirmation");
    if (!user.twoFactorSecret) throw new ValidationError("2FA setup not initialised");
    const ok = this.twofa.verify(user.twoFactorSecret, input.code);
    if (!ok) throw new ValidationError("Invalid confirmation code");
    await this.users.update(user.id, { twoFactorEnabled: true });
    return { status: "CONFIRMED" };
  }

  async disable(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User");
    await this.users.update(user.id, { twoFactorSecret: null, twoFactorEnabled: false });
  }
}
