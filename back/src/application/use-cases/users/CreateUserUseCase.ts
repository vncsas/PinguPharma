import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { IHasher } from "../../../domain/services/IHasher.js";
import type { PublicUser, UserRole, UserStatus } from "../../../domain/entities/User.js";
import { toPublicUser } from "../../../domain/entities/User.js";
import { ConflictError } from "../../../shared/errors/AppError.js";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
}

export class CreateUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<PublicUser> {
    const email = input.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictError(`E-mail '${email}' já cadastrado`);

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({
      name: input.name,
      email,
      passwordHash,
      role: input.role,
      status: input.status ?? "ACTIVE",
    });
    return toPublicUser(user);
  }
}
