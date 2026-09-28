import prisma from "../utils/prisma";

const DEFAULT_ID = "next_settlement_schedule";

function requireDate(value: unknown, field: string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  throw new Error(`${field} must be a valid date`);
}

function optionalDate(value: unknown, field: string): Date | undefined {
  if (value === undefined) return undefined;
  return requireDate(value, field);
}

export class NextSettlementScheduleService {
  async get() {
    return prisma.nextSettlementSchedule.findUnique({
      where: { id: DEFAULT_ID },
    });
  }

  async upsert(input: { nextSettlementDate?: unknown; nextPayOutDate?: unknown }) {
    const nextSettlementDate = optionalDate(input.nextSettlementDate, "nextSettlementDate");
    const nextPayOutDate = optionalDate(input.nextPayOutDate, "nextPayOutDate");

    if (nextSettlementDate === undefined && nextPayOutDate === undefined) {
      throw new Error("At least one field is required");
    }

    const existing = await prisma.nextSettlementSchedule.findUnique({
      where: { id: DEFAULT_ID },
      select: { id: true },
    });

    if (!existing) {
      if (nextSettlementDate === undefined || nextPayOutDate === undefined) {
        throw new Error("nextSettlementDate and nextPayOutDate are required");
      }
      return prisma.nextSettlementSchedule.create({
        data: {
          id: DEFAULT_ID,
          nextSettlementDate,
          nextPayOutDate,
        },
      });
    }

    return prisma.nextSettlementSchedule.update({
      where: { id: DEFAULT_ID },
      data: {
        ...(nextSettlementDate !== undefined && { nextSettlementDate }),
        ...(nextPayOutDate !== undefined && { nextPayOutDate }),
      },
    });
  }
}

export const nextSettlementScheduleService = new NextSettlementScheduleService();
