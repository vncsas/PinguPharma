import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  CreatePatientData,
  IPatientRepository,
  ListPatientsQuery,
  PaginatedPatients,
  UpdatePatientData,
} from "../../../domain/repositories/IPatientRepository.js";
import type { Patient } from "../../../domain/entities/Patient.js";

export class PrismaPatientRepository implements IPatientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: ListPatientsQuery): Promise<PaginatedPatients> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const term = query.search?.trim();
    const digits = term ? term.replace(/\D/g, "") : "";

    const searchFilter: Prisma.PatientWhereInput = term
      ? {
          OR: [
            { name: { contains: term } },
            ...(digits
              ? query.documentExactOnly
                ? [{ cpf: digits }, { cns: digits }]
                : [{ cpf: { contains: digits } }, { cns: { contains: digits } }]
              : []),
          ],
        }
      : {};
    const where: Prisma.PatientWhereInput = {
      AND: [query.active === undefined ? {} : { active: query.active }, searchFilter],
    };

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.patient.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  findById(id: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  findByCpf(cpf: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({ where: { cpf } });
  }

  findByCns(cns: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({ where: { cns } });
  }

  create(data: CreatePatientData): Promise<Patient> {
    return this.prisma.patient.create({
      data: {
        name: data.name,
        cns: data.cns ?? null,
        cpf: data.cpf ?? null,
        birthDate: data.birthDate ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
        active: data.active ?? true,
      },
    });
  }

  update(id: string, data: UpdatePatientData): Promise<Patient> {
    const fields = ["name", "cns", "cpf", "birthDate", "phone", "email", "address", "notes", "active"] as const;
    const patch: Record<string, unknown> = {};
    for (const f of fields) if (data[f] !== undefined) patch[f] = data[f];
    return this.prisma.patient.update({ where: { id }, data: patch });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.patient.delete({ where: { id } });
  }
}
