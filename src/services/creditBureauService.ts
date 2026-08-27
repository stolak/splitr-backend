import {
  CreditBureauBankruptcyStatus,
  CreditBureauCollectionsStatus,
  Prisma,
} from "@prisma/client";
import prisma from "../utils/prisma";

export interface CreateCreditBureauInput {
  buyerId: string;
  creditScore?: number | null;
  utilizationPercentage?: number | null;
  delinquencies24Months?: number | null;
  collections?: CreditBureauCollectionsStatus;
  hardInquiries12Months?: number;
  bankruptcy?: CreditBureauBankruptcyStatus;
  rawCreditBureau?: Prisma.InputJsonValue | null;
}

export interface UpdateCreditBureauInput {
  creditScore?: number | null;
  utilizationPercentage?: number | null;
  delinquencies24Months?: number | null;
  collections?: CreditBureauCollectionsStatus;
  hardInquiries12Months?: number;
  bankruptcy?: CreditBureauBankruptcyStatus;
  rawCreditBureau?: Prisma.InputJsonValue | null;
}

const COLLECTIONS_VALUES = new Set(["NONE", "PAID", "ACTIVE"]);
const BANKRUPTCY_VALUES = new Set([
  "NONE",
  "DISCHARGED_OVER_5_YEARS",
  "ACTIVE_OR_RECENT",
]);

export class CreditBureauService {
  private toResponse(record: any) {
    return {
      ...record,
      utilizationPercentage:
        record.utilizationPercentage !== null &&
        record.utilizationPercentage !== undefined
          ? Number(record.utilizationPercentage)
          : null,
    };
  }

  private async ensureBuyerExists(buyerId: string) {
    const buyer = await prisma.buyer.findUnique({ where: { id: buyerId } });
    if (!buyer) {
      throw new Error("Buyer not found");
    }
  }

  private validateEnums(input: {
    collections?: string;
    bankruptcy?: string;
  }) {
    if (
      input.collections !== undefined &&
      !COLLECTIONS_VALUES.has(input.collections)
    ) {
      throw new Error(
        "collections must be one of: NONE, PAID, ACTIVE"
      );
    }

    if (
      input.bankruptcy !== undefined &&
      !BANKRUPTCY_VALUES.has(input.bankruptcy)
    ) {
      throw new Error(
        "bankruptcy must be one of: NONE, DISCHARGED_OVER_5_YEARS, ACTIVE_OR_RECENT"
      );
    }
  }

  async create(input: CreateCreditBureauInput) {
    if (!input.buyerId) {
      throw new Error("buyerId is required");
    }

    this.validateEnums(input);
    await this.ensureBuyerExists(input.buyerId);

    const record = await prisma.creditBureau.create({
      data: {
        buyerId: input.buyerId,
        creditScore: input.creditScore ?? null,
        utilizationPercentage: input.utilizationPercentage ?? null,
        delinquencies24Months: input.delinquencies24Months ?? 0,
        collections: input.collections ?? CreditBureauCollectionsStatus.NONE,
        hardInquiries12Months: input.hardInquiries12Months ?? 0,
        bankruptcy: input.bankruptcy ?? CreditBureauBankruptcyStatus.NONE,
        rawCreditBureau:
          input.rawCreditBureau === undefined
            ? undefined
            : input.rawCreditBureau === null
              ? Prisma.JsonNull
              : input.rawCreditBureau,
      },
    });

    return this.toResponse(record);
  }

  async getById(id: string) {
    const record = await prisma.creditBureau.findUnique({ where: { id } });
    if (!record) {
      throw new Error("Credit bureau record not found");
    }
    return this.toResponse(record);
  }

  async list(buyerId?: string) {
    const records = await prisma.creditBureau.findMany({
      where: buyerId ? { buyerId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toResponse(record));
  }

  async getByBuyerId(buyerId: string) {
    await this.ensureBuyerExists(buyerId);
    const records = await prisma.creditBureau.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toResponse(record));
  }

  async update(id: string, input: UpdateCreditBureauInput) {
    const existing = await prisma.creditBureau.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Credit bureau record not found");
    }

    this.validateEnums(input);

    const record = await prisma.creditBureau.update({
      where: { id },
      data: {
        ...(input.creditScore !== undefined && {
          creditScore: input.creditScore,
        }),
        ...(input.utilizationPercentage !== undefined && {
          utilizationPercentage: input.utilizationPercentage,
        }),
        ...(input.delinquencies24Months !== undefined && {
          delinquencies24Months: input.delinquencies24Months,
        }),
        ...(input.collections !== undefined && {
          collections: input.collections,
        }),
        ...(input.hardInquiries12Months !== undefined && {
          hardInquiries12Months: input.hardInquiries12Months,
        }),
        ...(input.bankruptcy !== undefined && {
          bankruptcy: input.bankruptcy,
        }),
        ...(input.rawCreditBureau !== undefined && {
          rawCreditBureau:
            input.rawCreditBureau === null
              ? Prisma.JsonNull
              : input.rawCreditBureau,
        }),
      },
    });

    return this.toResponse(record);
  }

  async delete(id: string) {
    const existing = await prisma.creditBureau.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Credit bureau record not found");
    }

    await prisma.creditBureau.delete({ where: { id } });
    return { id };
  }
}

export const creditBureauService = new CreditBureauService();
