import { Prisma, SettlementRecordType } from "@prisma/client";
import prisma from "../utils/prisma";
import { roundUpTo2Decimals } from "../utils/helper";

export const SETTLEMENT_RECORD_TYPES = Object.values(SettlementRecordType);

const merchantSelect = { id: true, businessName: true, splitrId: true } as const;

function requireText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
}

function requireRecordType(value: unknown): SettlementRecordType {
  if (typeof value !== "string" || !SETTLEMENT_RECORD_TYPES.includes(value as SettlementRecordType)) {
    throw new Error(`settlementRecordType must be one of ${SETTLEMENT_RECORD_TYPES.join(", ")}`);
  }
  return value as SettlementRecordType;
}

function optionalRecordType(value: unknown): SettlementRecordType | undefined {
  if (value === undefined) return undefined;
  return requireRecordType(value);
}

function requireAmount(value: unknown, field: string): number {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (parsed === undefined) return 0;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new Error(`${field} must be a number`);
  }
  if (parsed < 0) {
    throw new Error(`${field} must be zero or greater`);
  }
  return roundUpTo2Decimals(parsed);
}

function optionalAmount(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  return requireAmount(value, field);
}

function mapSettlement<T extends { debit: Prisma.Decimal; credit: Prisma.Decimal }>(record: T) {
  return {
    ...record,
    debit: Number(record.debit),
    credit: Number(record.credit),
  };
}

export class SettlementService {
  async list(filters: {
    merchantId?: string;
    settlementRecordType?: SettlementRecordType;
    batchReference?: string;
  }) {
    const records = await prisma.settlement.findMany({
      where: {
        ...(filters.merchantId && { merchantId: filters.merchantId }),
        ...(filters.settlementRecordType && {
          settlementRecordType: filters.settlementRecordType,
        }),
        ...(filters.batchReference && { batchReference: filters.batchReference }),
      },
      include: { merchant: { select: merchantSelect } },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => mapSettlement(record));
  }

  async getById(id: string) {
    const record = await prisma.settlement.findUnique({
      where: { id },
      include: { merchant: { select: merchantSelect } },
    });
    return record ? mapSettlement(record) : null;
  }

  async create(input: {
    merchantId?: unknown;
    debit?: unknown;
    credit?: unknown;
    remarks?: unknown;
    settlementRecordType?: unknown;
    batchReference?: unknown;
  }) {
    const merchantId = requireText(input.merchantId, "merchantId", 191);
    const remarks = requireText(input.remarks, "remarks", 500);
    const settlementRecordType = requireRecordType(input.settlementRecordType);
    const batchReference = requireText(input.batchReference, "batchReference", 100);
    const debit = requireAmount(input.debit ?? 0, "debit");
    const credit = requireAmount(input.credit ?? 0, "credit");

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true },
    });
    if (!merchant) throw new Error("Merchant not found");

    const record = await prisma.settlement.create({
      data: {
        merchantId,
        debit,
        credit,
        remarks,
        settlementRecordType,
        batchReference,
      },
      include: { merchant: { select: merchantSelect } },
    });
    return mapSettlement(record);
  }

  async update(
    id: string,
    input: {
      merchantId?: unknown;
      debit?: unknown;
      credit?: unknown;
      remarks?: unknown;
      settlementRecordType?: unknown;
      batchReference?: unknown;
    }
  ) {
    const existing = await prisma.settlement.findUnique({ where: { id } });
    if (!existing) throw new Error("Settlement not found");

    const merchantId =
      input.merchantId === undefined ? undefined : requireText(input.merchantId, "merchantId", 191);
    const remarks =
      input.remarks === undefined ? undefined : requireText(input.remarks, "remarks", 500);
    const settlementRecordType = optionalRecordType(input.settlementRecordType);
    const batchReference =
      input.batchReference === undefined
        ? undefined
        : requireText(input.batchReference, "batchReference", 100);
    const debit = optionalAmount(input.debit, "debit");
    const credit = optionalAmount(input.credit, "credit");

    if (
      merchantId === undefined &&
      remarks === undefined &&
      settlementRecordType === undefined &&
      batchReference === undefined &&
      debit === undefined &&
      credit === undefined
    ) {
      throw new Error("At least one field is required");
    }

    if (merchantId && merchantId !== existing.merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { id: true },
      });
      if (!merchant) throw new Error("Merchant not found");
    }

    const record = await prisma.settlement.update({
      where: { id },
      data: {
        ...(merchantId !== undefined && { merchantId }),
        ...(remarks !== undefined && { remarks }),
        ...(settlementRecordType !== undefined && { settlementRecordType }),
        ...(batchReference !== undefined && { batchReference }),
        ...(debit !== undefined && { debit }),
        ...(credit !== undefined && { credit }),
      },
      include: { merchant: { select: merchantSelect } },
    });
    return mapSettlement(record);
  }

  async delete(id: string) {
    const existing = await prisma.settlement.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Settlement not found");
    await prisma.settlement.delete({ where: { id } });
    return { id };
  }
}

export const settlementService = new SettlementService();
