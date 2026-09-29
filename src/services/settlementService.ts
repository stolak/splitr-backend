import {
  Prisma,
  SettlementRecordType,
  TransactionStatus,
  MerchantTransactionType,
  ReserveStatus,
  ReserveType,
} from "@prisma/client";
import prisma from "../utils/prisma";
import { roundUpTo2Decimals } from "../utils/helper";
import { merchantPricingService } from "./merchantPricingService";
import { merchantReserveReleaseService } from "./merchantReserveService";
import { taxMatrixService } from "./taxMatrixService";
import { nextSettlementScheduleService } from "./nextSettlementScheduleService";

export const SETTLEMENT_RECORD_TYPES = Object.values(SettlementRecordType);

export type CreateSettlementInput = {
  merchantId: string;
  remarks: string;
  settlementRecordType: SettlementRecordType;
  batchReference: string;
  debit?: number;
  credit?: number;
  nextPayOutDate?: Date | string | null;
  nextSettlementDate?: Date | string | null;
};

export type UpdateSettlementInput = {
  merchantId?: string;
  remarks?: string;
  settlementRecordType?: SettlementRecordType;
  batchReference?: string;
  debit?: number;
  credit?: number;
  nextPayOutDate?: Date | string | null;
  nextSettlementDate?: Date | string | null;
};

const merchantSelect = { id: true, businessName: true, splitrId: true } as const;

function requireText(value: string | undefined, field: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
}

function requireRecordType(value: SettlementRecordType | undefined): SettlementRecordType {
  if (!value || !SETTLEMENT_RECORD_TYPES.includes(value)) {
    throw new Error(`settlementRecordType must be one of ${SETTLEMENT_RECORD_TYPES.join(", ")}`);
  }
  return value;
}

function optionalRecordType(
  value: SettlementRecordType | undefined
): SettlementRecordType | undefined {
  if (value === undefined) return undefined;
  return requireRecordType(value);
}

function requireAmount(value: number | undefined, field: string): number {
  const parsed = value ?? 0;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new Error(`${field} must be a number`);
  }
  if (parsed < 0) {
    throw new Error(`${field} must be zero or greater`);
  }
  return roundUpTo2Decimals(parsed);
}

function optionalAmount(value: number | undefined, field: string): number | undefined {
  if (value === undefined) return undefined;
  return requireAmount(value, field);
}

function optionalDate(value: Date | string | null | undefined, field: string): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  throw new Error(`${field} must be a valid date`);
}

function mapSettlement<T extends { debit: Prisma.Decimal; credit: Prisma.Decimal }>(record: T) {
  return {
    ...record,
    debit: Number(record.debit),
    credit: Number(record.credit),
  };
}

export class SettlementService {
  private async resolveMerchantTier(merchant: { merchantTierId: string | null }) {
    const defaultTier = await merchantPricingService.getDefaultTier();
    const merchantTierId = merchant.merchantTierId || defaultTier?.id || "";
    const merchantTier = await merchantPricingService.getTier(merchantTierId);
    if (!merchantTier) {
      throw new Error("Merchant tier not found for merchant Merchant must update his tier");
    }
    return merchantTier;
  }

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

  async listSettledGroupedByReference(filters: {
    startDate: Date;
    endDate: Date;
    merchantId?: string;
  }) {
    if (filters.startDate.getTime() > filters.endDate.getTime()) {
      throw new Error("startDate must be before or equal to endDate");
    }

    const records = await prisma.settlement.findMany({
      where: {
        isSettled: true,
        settlementReference: { not: null },
        settledDate: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        ...(filters.merchantId && { merchantId: filters.merchantId }),
      },
      orderBy: [{ settledDate: "desc" }, { createdAt: "asc" }],
    });

    const groups = new Map<
      string,
      {
        settlementReference: string;
        settledDate: Date | null;
        data: ReturnType<typeof mapSettlement>[];
      }
    >();

    for (const record of records) {
      const settlementReference = record.settlementReference as string;
      const mapped = mapSettlement(record);
      const existing = groups.get(settlementReference);
      if (!existing) {
        groups.set(settlementReference, {
          settlementReference,
          settledDate: record.settledDate,
          data: [mapped],
        });
        continue;
      }
      existing.data.push(mapped);
    }

    return [...groups.values()];
  }

  async getById(id: string) {
    const record = await prisma.settlement.findUnique({
      where: { id },
      include: { merchant: { select: merchantSelect } },
    });
    return record ? mapSettlement(record) : null;
  }

  async getUnsettledBalance(merchantId: string) {
    const totals = await prisma.settlement.aggregate({
      where: { merchantId, isSettled: false },
      _sum: { credit: true, debit: true },
    });
    const credit = Number(totals._sum.credit ?? 0);
    const debit = Number(totals._sum.debit ?? 0);
    return roundUpTo2Decimals(credit - debit);
  }

  async create(input: CreateSettlementInput) {
    const merchantId = requireText(input.merchantId, "merchantId", 191);
    const remarks = requireText(input.remarks, "remarks", 500);
    const settlementRecordType = requireRecordType(input.settlementRecordType);
    const batchReference = requireText(input.batchReference, "batchReference", 100);
    const debit = requireAmount(input.debit, "debit");
    const credit = requireAmount(input.credit, "credit");
    const nextPayOutDate = optionalDate(input.nextPayOutDate, "nextPayOutDate");
    const nextSettlementDate = optionalDate(input.nextSettlementDate, "nextSettlementDate");
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
        nextPayOutDate,
        nextSettlementDate,
      },
      include: { merchant: { select: merchantSelect } },
    });
    return mapSettlement(record);
  }

  async update(id: string, input: UpdateSettlementInput) {
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
    const nextPayOutDate = optionalDate(input.nextPayOutDate, "nextPayOutDate");
    const nextSettlementDate = optionalDate(input.nextSettlementDate, "nextSettlementDate");

    if (
      merchantId === undefined &&
      remarks === undefined &&
      settlementRecordType === undefined &&
      batchReference === undefined &&
      debit === undefined &&
      credit === undefined &&
      nextPayOutDate === undefined &&
      nextSettlementDate === undefined
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
        ...(nextPayOutDate !== undefined && { nextPayOutDate }),
        ...(nextSettlementDate !== undefined && { nextSettlementDate }),
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

  async deleteByBatchReference(batchReference: string) {
    const reference = requireText(batchReference, "batchReference", 100);
    const result = await prisma.settlement.deleteMany({
      where: { batchReference: reference },
    });
    if (result.count === 0) {
      throw new Error("Settlement not found");
    }
    return { batchReference: reference, deletedCount: result.count };
  }
  private async buildMarchanetPendingSettlementDraft(merchantId: string) {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new Error("Merchant not found");
    const merchantTier = await this.resolveMerchantTier(merchant);
    const provinceCode = merchant.provinceCode;
    if (!provinceCode)
      throw new Error("Province code not found for merchant Merchant must update his province");
    const provinceTax = await taxMatrixService.getByProvinceCode(provinceCode);
    if (!provinceTax)
      throw new Error("Province tax rate not found for merchant Merchant must update his province");
    const taxRate = provinceTax.gstRate + provinceTax.psrRate;

    const transactions = await prisma.merchantTransaction.findMany({
      where: {
        merchantId,
        transactionType: MerchantTransactionType.InvoiceCredit,
        status: TransactionStatus.Completed,
        isSettled: false,
      },
      select: {
        id: true,
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
    const nextSettlementDate = await nextSettlementScheduleService.get();
    const taxAmount = roundUpTo2Decimals(grossFee * taxRate * 0.01);
    const rollingMaturityDay = merchantTier.tCutOff?.rollingMaturityDay || 0;
    const releasedDate = new Date(Date.now() + rollingMaturityDay * 24 * 60 * 60 * 1000);

    const reserveReleases: Array<{
      merchantId: string;
      amount: number;
      remarks: string;
      reserveReference: string;
      reserveStatus: ReserveStatus;
      releasedDate: Date;
      reserveType: ReserveType;
    }> = [];
    let reserveAmount = 0;
    for (const curr of result) {
      const mt = merchantTier.rollingReserves?.find(
        (r) => r.productConfigurationId === curr.productConfigurationId
      );
      const rate = mt?.rate || 0;
      const lineReserve = roundUpTo2Decimals(curr.amount * Number(rate) * 0.01);
      reserveAmount = roundUpTo2Decimals(reserveAmount + lineReserve);
      if (lineReserve > 0) {
        reserveReleases.push({
          merchantId,
          amount: lineReserve,
          remarks: `Reserve for  ${mt?.productConfiguration?.productName}: ${curr.amount} X ${rate}%`,
          reserveReference: batchReference,
          reserveStatus: ReserveStatus.PENDING,
          releasedDate,
          reserveType: ReserveType.ReserveRelease,
        });
      }
    }

    const settlementBase = {
      merchantId,
      batchReference,
      nextPayOutDate: nextSettlementDate.nextPayOutDate,
      nextSettlementDate: nextSettlementDate.nextSettlementDate,
    };

    const settlementCandidates: CreateSettlementInput[] = [
      {
        ...settlementBase,
        debit: 0,
        credit: grossAmount,
        remarks: `Gross amount due for settlement as at ${Date.now()}`,
        settlementRecordType: SettlementRecordType.Gross,
      },
      {
        ...settlementBase,
        debit: grossFee,
        credit: 0,
        remarks: `Total Marchanet fees on ${grossAmount}`,
        settlementRecordType: SettlementRecordType.MerchantFees,
      },
      {
        ...settlementBase,
        debit: taxAmount,
        credit: 0,
        remarks: `Total  tax on merchant fees ${grossFee}`,
        settlementRecordType: SettlementRecordType.Tax,
      },
      {
        ...settlementBase,
        debit: reserveAmount,
        credit: 0,
        remarks: `Total reserve on merchant Gross ${grossAmount}`,
        settlementRecordType: SettlementRecordType.Reserve,
      },
    ];

    const matureReserveReleases = await merchantReserveReleaseService.list({
      merchantId,
      reserveStatus: ReserveStatus.PENDING,
      releasedDate: {
        lte: new Date(Date.now()),
      },
    });
    settlementCandidates.push({
      ...settlementBase,
      debit: matureReserveReleases.reduce((acc, curr) => acc + Number(curr.amount), 0),
      credit: 0,
      remarks: `Total mature reserve releases ${matureReserveReleases.length}`,
      settlementRecordType: SettlementRecordType.Reserve,
    });

    const settlements = settlementCandidates.filter(
      (row) => (row.debit ?? 0) !== 0 || (row.credit ?? 0) !== 0
    );

    return {
      merchantTier,
      batchReference,
      settlements,
      reserveReleases,
      matureReserveReleaseIds: matureReserveReleases.map((r) => r.id),
      transactionIds: transactions.map((t) => t.id),
      productTotals: result,
      totals: {
        grossAmount,
        grossFee,
        taxAmount,
        reserveAmount,
      },
    };
  }

  async simulateMarchanetPendingSettlement(input: { merchantId: string }) {
    const draft = await this.buildMarchanetPendingSettlementDraft(input.merchantId);
    return {
      success: true as const,
      merchantTier: draft.merchantTier,
      batchReference: draft.batchReference,
      settlements: draft.settlements,
      reserveReleases: draft.reserveReleases,
      matureReserveReleaseIds: draft.matureReserveReleaseIds,
      transactionIds: draft.transactionIds,
      productTotals: draft.productTotals,
      totals: draft.totals,
    };
  }

  async computeMarchanetPendingSettlement(input: { merchantId: string }) {
    const draft = await this.buildMarchanetPendingSettlementDraft(input.merchantId);

    for (const reserveRelease of draft.reserveReleases) {
      await merchantReserveReleaseService.create(reserveRelease);
    }
    for (const settlement of draft.settlements) {
      await this.create(settlement);
    }

    if (draft.matureReserveReleaseIds.length > 0) {
      await merchantReserveReleaseService.updateMany({
        where: {
          id: { in: draft.matureReserveReleaseIds },
        },
        data: {
          reserveStatus: ReserveStatus.COMPLETED,
        },
      });
    }

    if (draft.transactionIds.length > 0) {
      await prisma.merchantTransaction.updateMany({
        where: {
          id: { in: draft.transactionIds },
          merchantId: input.merchantId,
          transactionType: MerchantTransactionType.InvoiceCredit,
          status: TransactionStatus.Completed,
          isSettled: false,
        },
        data: {
          isSettled: true,
          groupReference: draft.batchReference,
        },
      });
    }

    return { success: true, merchantTier: draft.merchantTier };
  }
  async instantSettleMent(input: { merchantId: string }) {
    const settlement = await this.computeMarchanetPendingSettlement({
      merchantId: input.merchantId,
    });
    const unsettledBalance = await this.getUnsettledBalance(input.merchantId);
    const batchReference = `${input.merchantId}_INSTANT_SETTLEMENT_${Date.now()}`;
    if (unsettledBalance > 0) {
      const instantSettlementSettings = settlement.merchantTier.instantPayoutSettings;
      const instantPayoutChargeRate =
        Number(instantSettlementSettings?.baseRate) +
        Number(instantSettlementSettings?.surchargeRate);
      const maxPayoutAmount = roundUpTo2Decimals(
        Number(unsettledBalance * Number(instantSettlementSettings?.maxPayoutPercentage) * 0.01)
      );
      const chargeAmount = roundUpTo2Decimals(maxPayoutAmount * instantPayoutChargeRate * 0.01);
      const witholdingAmount = roundUpTo2Decimals(unsettledBalance - maxPayoutAmount);
      await this.create({
        merchantId: input.merchantId,
        debit: chargeAmount,
        credit: 0,
        remarks: `Instant settlement charge on ${unsettledBalance}`,
        settlementRecordType: SettlementRecordType.MerchantFees,
        batchReference,
      });
      await this.create({
        merchantId: input.merchantId,
        debit: witholdingAmount,
        credit: 0,
        remarks: `Instant settlement witholding on ${unsettledBalance}`,
        settlementRecordType: SettlementRecordType.CallUpWithhold,
        batchReference,
      });
      await merchantReserveReleaseService.create({
        merchantId: input.merchantId,
        amount: witholdingAmount,
        remarks: `Instant settlement witholding on ${unsettledBalance}`,
        reserveReference: batchReference,
        reserveStatus: ReserveStatus.PENDING,
        reserveType: ReserveType.InstantCallUp,
        releasedDate: new Date(Date.now()),
      });
    }

    return { success: true, batchReference };
  }

  async pendingSettlements(input: { merchantId: string }) {
    const pendingSettlements = await prisma.settlement.findMany({
      where: {
        merchantId: input.merchantId,
        isSettled: false,
      },
    });
    return pendingSettlements;
  }
  async pendingSettlementsReadyForPayment(input: { merchantId: string }) {
    const nextSettlementDate = await nextSettlementScheduleService.get();
    const pendingSettlements = await prisma.settlement.findMany({
      where: {
        merchantId: input.merchantId,
        isSettled: false,
        nextPayOutDate: {
          lte: nextSettlementDate.nextPayOutDate,
        },
        nextSettlementDate: {
          lte: nextSettlementDate.nextSettlementDate,
        },
      },
    });
    return pendingSettlements;
  }
  async merchantSettlementDashboud(input: {
    merchantId: string;
    dateRange?: { startDate: Date; endDate: Date };
  }) {
    // if dateRange is not provided, use the current date+1 day for endDate and aweek ago date for startDate
    const endDate = input.dateRange?.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000);
    const startDate = input.dateRange?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // get merchant transactions between startDate and endDate where transactionType is InvoiceCredit and status is Completed and isSettled is false
    const merchant = await prisma.merchant.findUnique({ where: { id: input.merchantId } });
    if (!merchant) throw new Error("Merchant not found");

    const [
      merchantTransactions,
      reserveReleases,
      pendingSettlements,
      pendingSettlementsReadyForPayment,
      settledTransactions,
      merchantTier,
    ] = await Promise.all([
      prisma.merchantTransaction.findMany({
        where: {
          merchantId: input.merchantId,
          transactionType: MerchantTransactionType.InvoiceCredit,
          status: TransactionStatus.Completed,
          // isSettled: false,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.merchantReserveRelease.findMany({
        where: {
          merchantId: input.merchantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      this.pendingSettlements({ merchantId: input.merchantId }),
      this.pendingSettlementsReadyForPayment({ merchantId: input.merchantId }),
      this.listSettledGroupedByReference({ merchantId: input.merchantId, startDate, endDate }),
      this.resolveMerchantTier({ merchantTierId: merchant?.merchantTierId || null }),
    ]);

    return {
      nextPayment: roundUpTo2Decimals(
        pendingSettlementsReadyForPayment.reduce(
          (acc, curr) => acc + Number(curr.credit) - +Number(curr.debit),
          0
        )
      ),
      callupEligibility: roundUpTo2Decimals(
        pendingSettlements.reduce((acc, curr) => acc + Number(curr.credit) - +Number(curr.debit), 0)
      ),
      reserveReleases,
      settledTransactions,
      pendingSettlements,
      nextPayOut: pendingSettlementsReadyForPayment,
      merchantTransactions,
      merchantTier,
    };
  }
}

export const settlementService = new SettlementService();
