import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { PublicUser, UserRole, UserStatus } from "../../../domain/entities/User.js";
import { toPublicUser } from "../../../domain/entities/User.js";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepository.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  unitId?: string | null;
}

export class UpdateUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly units: IUnitRepository,
  ) {}

  async execute(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError("User");

    if (input.email && input.email.toLowerCase() !== user.email) {
      const other = await this.users.findByEmail(input.email.toLowerCase());
      if (other) throw new ConflictError(`E-mail já cadastrado`);
    }

    const role = input.role ?? user.role;
    const unitId = input.unitId !== undefined ? input.unitId : user.unitId;
    if (role !== "ADMIN" && !unitId) throw new ValidationError("Unidade é obrigatória para este perfil");
    if (input.unitId && !(await this.units.findById(input.unitId))) throw new NotFoundError("Unit");

    const updated = await this.users.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
    });
    if (
      (input.role !== undefined && input.role !== user.role) || (input.unitId !== undefined && input.unitId !== user.unitId) ||
      (input.status !== undefined && input.status !== user.status)
    ) {
      await this.users.incrementTokenVersion(id);
    }
    return toPublicUser(updated);
  }
}
