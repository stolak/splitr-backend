import {
  Prisma,
  SettlementRecordType,
  TransactionStatus,
  MerchantTransactionType,
  ReserveStatus,
} from "@prisma/client";
import prisma from "../utils/prisma";
import { roundUpTo2Decimals } from "../utils/helper";
import { merchantPricingService } from "./merchantPricingService";
import { merchantReserveReleaseService } from "./merchantReserveService";
import { taxMatrixService } from "./taxMatrixService";

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
  if (
    typeof value !== "string" ||
    !SETTLEMENT_RECORD_TYPES.includes(value as SettlementRecordType)
  ) {
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
    if (debit === 0 && credit === 0) {
      return null;
    }

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
  async computeMarchanetPendingSettlement(input: { merchantId: string }) {
    const merchant = await prisma.merchant.findUnique({ where: { id: input.merchantId } });
    if (!merchant) throw new Error("Merchant not found");
    const defaultTier = await merchantPricingService.getDefaultTier();
    const merchantTierId = merchant.merchantTierId || defaultTier?.id || "";
    const provinceCode = merchant.provinceCode;
    if (!provinceCode)
      throw new Error("Province code not found for merchant Merchant must update his province");
    // get province tax rate
    const provinceTax = await taxMatrixService.getByProvinceCode(provinceCode);
    if (!provinceTax)
      throw new Error("Province tax rate not found for merchant Merchant must update his province");
    const taxRate = provinceTax.gstRate + provinceTax.psrRate;

    // get mercahnt reserve rate
    const merchantTier = await merchantPricingService.getTier(merchantTierId);
    if (!merchantTier)
      throw new Error("Merchant tier not found for merchant Merchant must update his tier");
    console.log(merchantTier);
    // const reserveRate = merchantTier.rollingReserves;
    // if (!merchantFee) throw new Error("Merchant fee not found");
    const transactions = await prisma.merchantTransaction.findMany({
      where: {
        merchantId: input.merchantId,
        transactionType: MerchantTransactionType.InvoiceCredit,
        status: TransactionStatus.Completed,
        isSettled: false,
      },
      select: {
        productConfigurationId: true,
        credit: true,
        chargeRate: true,
      },
    });

    const totals = new Map<string | null, { amount: number; merchantFee: number }>();
    for (const transaction of transactions) {
      const productConfigurationId = transaction.productConfigurationId;
      const lineAmount = Number(transaction.credit);
      const lineFee = lineAmount * Number(transaction.chargeRate) * 0.01;
      const current = totals.get(productConfigurationId) ?? { amount: 0, merchantFee: 0 };
      totals.set(productConfigurationId, {
        amount: current.amount + lineAmount,
        merchantFee: current.merchantFee + lineFee,
      });
    }

    const result = [...totals.entries()].map(([productConfigurationId, group]) => ({
      productConfigurationId,
      amount: roundUpTo2Decimals(group.amount),
      merchantFee: roundUpTo2Decimals(group.merchantFee),
    }));

    const grossAmount = roundUpTo2Decimals(result.reduce((acc, curr) => acc + curr.amount, 0));
    const grossFee = roundUpTo2Decimals(result.reduce((acc, curr) => acc + curr.merchantFee, 0));
    const batchReference = `MARCHANET_PENDING_SETTLEMENT_${Date.now()}`;

    const taxAmount = roundUpTo2Decimals(grossFee * taxRate * 0.01);
    const reserveAmount = roundUpTo2Decimals(
      result.reduce((acc, curr) => {
        const rate =
          merchantTier.rollingReserves.find(
            (r) => r.productConfigurationId === curr.productConfigurationId
          )?.rate || 0;
        return acc + roundUpTo2Decimals(curr.amount * Number(rate) * 0.01);
      }, 0)
    );
    this.create({
      merchantId: input.merchantId,
      debit: 0,
      credit: grossAmount,
      remarks: `Gross amount due for settlement as at ${Date.now()}`,
      settlementRecordType: SettlementRecordType.Gross,
      batchReference,
    });

    this.create({
      merchantId: input.merchantId,
      debit: grossFee,
      credit: 0,
      remarks: `Total Marchanet fees on ${grossAmount}`,
      settlementRecordType: SettlementRecordType.MerchantFees,
      batchReference,
    });
    this.create({
      merchantId: input.merchantId,
      debit: taxAmount,
      credit: 0,
      remarks: `Total  tax on merchant fees ${grossFee}`,
      settlementRecordType: SettlementRecordType.Tax,
      batchReference,
    });
    this.create({
      merchantId: input.merchantId,
      debit: reserveAmount,
      credit: 0,
      remarks: `Total reserve on merchant Gross ${grossAmount}`,
      settlementRecordType: SettlementRecordType.Reserve,
      batchReference,
    });

    // get all mature reserve releases
    const matureReserveReleases = await merchantReserveReleaseService.list({
      merchantId: input.merchantId,
      reserveStatus: ReserveStatus.PENDING,
      releasedDate: {
        lte: new Date(Date.now()),
      },
    });
    this.create({
      merchantId: input.merchantId,
      debit: matureReserveReleases.reduce((acc, curr) => acc + Number(curr.amount), 0),
      credit: 0,
      remarks: `Total mature reserve releases ${matureReserveReleases.length}`,
      settlementRecordType: SettlementRecordType.Reserve,
      batchReference,
    });
    if (matureReserveReleases.length > 0) {
      // set all mature reserve releases status to released
      await merchantReserveReleaseService.updateMany({
        where: {
          id: { in: matureReserveReleases.map((r) => r.id) },
        },
        data: {
          reserveStatus: ReserveStatus.COMPLETED,
        },
      });
    }
    await merchantReserveReleaseService.create({
      merchantId: input.merchantId,
      amount: reserveAmount,
      remarks: `Reserve on merchant Gross ${grossAmount} ${merchantTier.tCutOff?.rollingMaturityDay} days`,
      reserveReference: batchReference,
      reserveStatus: ReserveStatus.PENDING,
      releasedDate: new Date(
        Date.now() + (merchantTier.tCutOff?.rollingMaturityDay || 0) * 24 * 60 * 60 * 1000
      ),
    });

    // update merchant transactions to settled and isSettled to true
    await prisma.merchantTransaction.updateMany({
      where: {
        merchantId: input.merchantId,
        transactionType: MerchantTransactionType.InvoiceCredit,
        status: TransactionStatus.Completed,
        isSettled: false,
      },
      data: {
        isSettled: true,
        groupReference: batchReference,
      },
    });
    return { success: true };
  }
}

export const settlementService = new SettlementService();
