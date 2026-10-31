import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  CreatePrescriptionData,
  IPrescriptionRepository,
  ListPrescriptionsQuery,
  PaginatedPrescriptions,
} from "../../../domain/repositories/IPrescriptionRepository.js";
import type {
  PrescriberCouncil,
  Prescription,
  PrescriptionDetail,
} from "../../../domain/entities/Prescription.js";

function toPrescription(row: Prisma.PrescriptionGetPayload<object>): Prescription {
  return { ...row, prescriberCouncil: row.prescriberCouncil as PrescriberCouncil };
}

const detailInclude = {
  patient: { select: { name: true } },
  unit: { select: { name: true } },
  creator: { select: { name: true } },
} satisfies Prisma.PrescriptionInclude;

function toDetail(row: Prisma.PrescriptionGetPayload<{ include: typeof detailInclude }>): PrescriptionDetail {
  return {
    ...toPrescription(row),
    patientName: row.patient.name,
    unitName: row.unit.name,
    createdByName: row.creator.name,
  };
}

export class PrismaPrescriptionRepository implements IPrescriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePrescriptionData): Promise<Prescription> {
    const row = await this.prisma.prescription.create({
      data: {
        patientId: data.patientId,
        unitId: data.unitId,
        prescriberName: data.prescriberName,
        prescriberCouncil: data.prescriberCouncil,
        prescriberCouncilNumber: data.prescriberCouncilNumber,
        number: data.number ?? null,
        issuedAt: data.issuedAt,
        validUntil: data.validUntil,
        retained: data.retained ?? false,
        notes: data.notes ?? null,
        createdBy: data.createdBy,
      },
    });
    return toPrescription(row);
  }

  async findById(id: string): Promise<PrescriptionDetail | null> {
    const row = await this.prisma.prescription.findUnique({ where: { id }, include: detailInclude });
    return row ? toDetail(row) : null;
  }

  async list(query: ListPrescriptionsQuery): Promise<PaginatedPrescriptions> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.PrescriptionWhereInput = {
      AND: [
        query.unitId ? { unitId: query.unitId } : {},
        query.patientId ? { patientId: query.patientId } : {},
        query.validOnly ? { validUntil: { gte: new Date() } } : {},
      ],
    };
    const [rows, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: detailInclude,
        orderBy: { issuedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.prescription.count({ where }),
    ]);
    return { data: rows.map(toDetail), total, page, pageSize };
  }
}
