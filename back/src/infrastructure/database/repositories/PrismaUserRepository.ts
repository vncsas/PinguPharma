import type { PrismaClient } from "@prisma/client";
import type {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
} from "../../../domain/repositories/IUserRepository.js";
import type { User, UserRole, UserStatus } from "../../../domain/entities/User.js";

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const u = await this.prisma.user.findUnique({ where: { id } });
    return u as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const u = await this.prisma.user.findUnique({ where: { email } });
    return u as User | null;
  }

  async list(params: { search?: string; role?: UserRole; status?: UserStatus } = {}): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          params.role ? { role: params.role } : {},
          params.status ? { status: params.status } : {},
          params.search
            ? {
                OR: [
                  { name: { contains: params.search} },
                  { email: { contains: params.search} },
                ],
              }
            : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return users as User[];
  }

  async create(data: CreateUserData): Promise<User> {
    const u = await this.prisma.user.create({ data });
    return u as User;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const u = await this.prisma.user.update({ where: { id }, data });
    return u as User;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
