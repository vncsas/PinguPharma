import type { PrismaClient } from "@prisma/client";
import type {
  CreateCustomerData,
  ICustomerRepository,
  UpdateCustomerData,
} from "../../../domain/repositories/ICustomerRepository.js";
import type { Customer } from "../../../domain/entities/Customer.js";

export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(search?: string): Promise<Customer[]> {
    const rows = await this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { document: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
      take: 100,
    });
    return rows;
  }

  async findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        document: data.document ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
      },
    });
  }

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.document !== undefined ? { document: data.document } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customer.delete({ where: { id } });
  }
}
