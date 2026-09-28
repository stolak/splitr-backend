import { Prisma, ReserveStatus } from "@prisma/client";
import prisma from "../utils/prisma";
import { roundUpTo2Decimals } from "../utils/helper";

export const RESERVE_STATUSES = Object.values(ReserveStatus);

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

function optionalText(value: unknown, field: string, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return requireText(value, field, maxLength);
}

function requireStatus(value: unknown): ReserveStatus {
  if (typeof value !== "string" || !RESERVE_STATUSES.includes(value as ReserveStatus)) {
    throw new Error(`reserveStatus must be one of ${RESERVE_STATUSES.join(", ")}`);
  }
  return value as ReserveStatus;
}

function optionalStatus(value: unknown): ReserveStatus | undefined {
  if (value === undefined) return undefined;
  return requireStatus(value);
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

function requireDate(value: unknown, field: string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  throw new Error(`${field} must be a valid date`);
}

function optionalDate(value: unknown, field: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return requireDate(value, field);
}

function mapAmount<T extends { amount: Prisma.Decimal }>(record: T) {
  return { ...record, amount: Number(record.amount) };
}

async function assertMerchant(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true },
  });
  if (!merchant) throw new Error("Merchant not found");
}

export class MerchantReserveReleaseService {
  async list(filters: {
    merchantId?: string;
    reserveReference?: string;
    releaseReference?: string;
    reserveStatus?: ReserveStatus;
    releasedDate?: Prisma.DateTimeNullableFilter;
  }) {
    const records = await prisma.merchantReserveRelease.findMany({
      where: {
        ...(filters.merchantId && { merchantId: filters.merchantId }),
        ...(filters.reserveReference && { reserveReference: filters.reserveReference }),
        ...(filters.releaseReference && { releaseReference: filters.releaseReference }),
        ...(filters.reserveStatus && { reserveStatus: filters.reserveStatus }),
        ...(filters.releasedDate && { releasedDate: filters.releasedDate }),
      },
      include: { merchant: { select: merchantSelect } },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => mapAmount(record));
  }

  async getById(id: string) {
    const record = await prisma.merchantReserveRelease.findUnique({
      where: { id },
      include: { merchant: { select: merchantSelect } },
    });
    return record ? mapAmount(record) : null;
  }

  async create(input: {
    merchantId?: unknown;
    amount?: unknown;
    remarks?: unknown;
    reserveReference?: unknown;
    releaseReference?: unknown;
    reservedDate?: unknown;
    releasedDate?: unknown;
    reserveStatus?: unknown;
  }) {
    const merchantId = requireText(input.merchantId, "merchantId", 191);
    const remarks = requireText(input.remarks, "remarks", 500);
    const reserveReference = requireText(input.reserveReference, "reserveReference", 100);
    const releaseReference = optionalText(input.releaseReference, "releaseReference", 100);
    const reserveStatus = requireStatus(input.reserveStatus);
    const rawAmount = input.amount ?? 0;
    const parsedAmount =
      typeof rawAmount === "string" && rawAmount.trim() !== "" ? Number(rawAmount) : rawAmount;
    if (typeof parsedAmount === "number" && Number.isFinite(parsedAmount) && parsedAmount <= 0) {
      return null;
    }
    const amount = requireAmount(rawAmount, "amount");
    const reservedDate =
      input.reservedDate === undefined ? undefined : requireDate(input.reservedDate, "reservedDate");
    const releasedDate = optionalDate(input.releasedDate, "releasedDate");

    await assertMerchant(merchantId);

    const record = await prisma.merchantReserveRelease.create({
      data: {
        merchantId,
        amount,
        remarks,
        reserveReference,
        reserveStatus,
        ...(releaseReference !== undefined && { releaseReference }),
        ...(reservedDate !== undefined && { reservedDate }),
        ...(releasedDate !== undefined && { releasedDate }),
      },
      include: { merchant: { select: merchantSelect } },
    });
    return mapAmount(record);
  }

  async update(
    id: string,
    input: {
      merchantId?: unknown;
      amount?: unknown;
      remarks?: unknown;
      reserveReference?: unknown;
      releaseReference?: unknown;
      reservedDate?: unknown;
      releasedDate?: unknown;
      reserveStatus?: unknown;
    }
  ) {
    const existing = await prisma.merchantReserveRelease.findUnique({ where: { id } });
    if (!existing) throw new Error("Merchant reserve release not found");

    const merchantId =
      input.merchantId === undefined ? undefined : requireText(input.merchantId, "merchantId", 191);
    const remarks = input.remarks === undefined ? undefined : requireText(input.remarks, "remarks", 500);
    const reserveReference =
      input.reserveReference === undefined
        ? undefined
        : requireText(input.reserveReference, "reserveReference", 100);
    const releaseReference = optionalText(input.releaseReference, "releaseReference", 100);
    const reserveStatus = optionalStatus(input.reserveStatus);
    const amount = optionalAmount(input.amount, "amount");
    const reservedDate =
      input.reservedDate === undefined ? undefined : requireDate(input.reservedDate, "reservedDate");
    const releasedDate = optionalDate(input.releasedDate, "releasedDate");

    if (
      merchantId === undefined &&
      remarks === undefined &&
      reserveReference === undefined &&
      releaseReference === undefined &&
      reserveStatus === undefined &&
      amount === undefined &&
      reservedDate === undefined &&
      releasedDate === undefined
    ) {
      throw new Error("At least one field is required");
    }

    if (merchantId && merchantId !== existing.merchantId) {
      await assertMerchant(merchantId);
    }

    const record = await prisma.merchantReserveRelease.update({
      where: { id },
      data: {
        ...(merchantId !== undefined && { merchantId }),
        ...(remarks !== undefined && { remarks }),
        ...(reserveReference !== undefined && { reserveReference }),
        ...(releaseReference !== undefined && { releaseReference }),
        ...(reserveStatus !== undefined && { reserveStatus }),
        ...(amount !== undefined && { amount }),
        ...(reservedDate !== undefined && { reservedDate }),
        ...(releasedDate !== undefined && { releasedDate }),
      },
      include: { merchant: { select: merchantSelect } },
    });
    return mapAmount(record);
  }

  async updateMany(input: {
    where: Prisma.MerchantReserveReleaseWhereInput;
    data: Prisma.MerchantReserveReleaseUpdateManyMutationInput;
  }) {
    return prisma.merchantReserveRelease.updateMany({
      where: input.where,
      data: input.data,
    });
  }

  async delete(id: string) {
    const existing = await prisma.merchantReserveRelease.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Merchant reserve release not found");
    await prisma.merchantReserveRelease.delete({ where: { id } });
    return { id };
  }
}

export class MerchantReserveContributionService {
  async list(filters: {
    merchantId?: string;
    batchReference?: string;
    reserveStatus?: ReserveStatus;
  }) {
    const records = await prisma.merchantReserveContribution.findMany({
      where: {
        ...(filters.merchantId && { merchantId: filters.merchantId }),
        ...(filters.batchReference && { batchReference: filters.batchReference }),
        ...(filters.reserveStatus && { reserveStatus: filters.reserveStatus }),
      },
      include: { merchant: { select: merchantSelect } },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => mapAmount(record));
  }

  async getById(id: string) {
    const record = await prisma.merchantReserveContribution.findUnique({
      where: { id },
      include: { merchant: { select: merchantSelect } },
    });
    return record ? mapAmount(record) : null;
  }

  async create(input: {
    merchantId?: unknown;
    amount?: unknown;
    remarks?: unknown;
    batchReference?: unknown;
    contributionDate?: unknown;
    reserveStatus?: unknown;
  }) {
    const merchantId = requireText(input.merchantId, "merchantId", 191);
    const remarks = requireText(input.remarks, "remarks", 500);
    const batchReference = requireText(input.batchReference, "batchReference", 100);
    const reserveStatus = requireStatus(input.reserveStatus);
    const amount = requireAmount(input.amount ?? 0, "amount");
    const contributionDate =
      input.contributionDate === undefined
        ? undefined
        : requireDate(input.contributionDate, "contributionDate");

    await assertMerchant(merchantId);

    const record = await prisma.merchantReserveContribution.create({
      data: {
        merchantId,
        amount,
        remarks,
        batchReference,
        reserveStatus,
        ...(contributionDate !== undefined && { contributionDate }),
      },
      include: { merchant: { select: merchantSelect } },
    });
    return mapAmount(record);
  }

  async update(
    id: string,
    input: {
      merchantId?: unknown;
      amount?: unknown;
      remarks?: unknown;
      batchReference?: unknown;
      contributionDate?: unknown;
      reserveStatus?: unknown;
    }
  ) {
    const existing = await prisma.merchantReserveContribution.findUnique({ where: { id } });
    if (!existing) throw new Error("Merchant reserve contribution not found");

    const merchantId =
      input.merchantId === undefined ? undefined : requireText(input.merchantId, "merchantId", 191);
    const remarks = input.remarks === undefined ? undefined : requireText(input.remarks, "remarks", 500);
    const batchReference =
      input.batchReference === undefined
        ? undefined
        : requireText(input.batchReference, "batchReference", 100);
    const reserveStatus = optionalStatus(input.reserveStatus);
    const amount = optionalAmount(input.amount, "amount");
    const contributionDate =
      input.contributionDate === undefined
        ? undefined
        : requireDate(input.contributionDate, "contributionDate");

    if (
      merchantId === undefined &&
      remarks === undefined &&
      batchReference === undefined &&
      reserveStatus === undefined &&
      amount === undefined &&
      contributionDate === undefined
    ) {
      throw new Error("At least one field is required");
    }

    if (merchantId && merchantId !== existing.merchantId) {
      await assertMerchant(merchantId);
    }

    const record = await prisma.merchantReserveContribution.update({
      where: { id },
      data: {
        ...(merchantId !== undefined && { merchantId }),
        ...(remarks !== undefined && { remarks }),
        ...(batchReference !== undefined && { batchReference }),
        ...(reserveStatus !== undefined && { reserveStatus }),
        ...(amount !== undefined && { amount }),
        ...(contributionDate !== undefined && { contributionDate }),
      },
      include: { merchant: { select: merchantSelect } },
    });
    return mapAmount(record);
  }

  async delete(id: string) {
    const existing = await prisma.merchantReserveContribution.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Merchant reserve contribution not found");
    await prisma.merchantReserveContribution.delete({ where: { id } });
    return { id };
  }
}

export const merchantReserveReleaseService = new MerchantReserveReleaseService();
export const merchantReserveContributionService = new MerchantReserveContributionService();
