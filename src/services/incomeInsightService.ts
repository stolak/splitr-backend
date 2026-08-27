import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

export interface CreateIncomeInsightInput {
  buyerId: string;
  monthlyIncome?: number | null;
  incomeStabilityVariance?: number | null;
  netCashFlowPercentage?: number | null;
  liquidityMonths?: number | null;
  nsfEvents?: number | null;
  overdraftFrequency?: number | null;
  loanBurdenPercentage?: number | null;
  rawInsight?: Prisma.InputJsonValue | null;
}

export interface UpdateIncomeInsightInput {
  monthlyIncome?: number | null;
  incomeStabilityVariance?: number | null;
  netCashFlowPercentage?: number | null;
  liquidityMonths?: number | null;
  nsfEvents?: number | null;
  overdraftFrequency?: number | null;
  loanBurdenPercentage?: number | null;
  rawInsight?: Prisma.InputJsonValue | null;
}

export class IncomeInsightService {
  private toResponse(record: any) {
    return {
      ...record,
      monthlyIncome:
        record.monthlyIncome !== null && record.monthlyIncome !== undefined
          ? Number(record.monthlyIncome)
          : null,
      incomeStabilityVariance:
        record.incomeStabilityVariance !== null &&
        record.incomeStabilityVariance !== undefined
          ? Number(record.incomeStabilityVariance)
          : null,
      netCashFlowPercentage:
        record.netCashFlowPercentage !== null &&
        record.netCashFlowPercentage !== undefined
          ? Number(record.netCashFlowPercentage)
          : null,
      liquidityMonths:
        record.liquidityMonths !== null && record.liquidityMonths !== undefined
          ? Number(record.liquidityMonths)
          : null,
      loanBurdenPercentage:
        record.loanBurdenPercentage !== null &&
        record.loanBurdenPercentage !== undefined
          ? Number(record.loanBurdenPercentage)
          : null,
    };
  }

  private async ensureBuyerExists(buyerId: string) {
    const buyer = await prisma.buyer.findUnique({ where: { id: buyerId } });
    if (!buyer) {
      throw new Error("Buyer not found");
    }
  }

  async create(input: CreateIncomeInsightInput) {
    if (!input.buyerId) {
      throw new Error("buyerId is required");
    }

    await this.ensureBuyerExists(input.buyerId);

    const record = await prisma.incomeInsight.create({
      data: {
        buyerId: input.buyerId,
        monthlyIncome: input.monthlyIncome ?? null,
        incomeStabilityVariance: input.incomeStabilityVariance ?? null,
        netCashFlowPercentage: input.netCashFlowPercentage ?? null,
        liquidityMonths: input.liquidityMonths ?? null,
        nsfEvents: input.nsfEvents ?? 0,
        overdraftFrequency: input.overdraftFrequency ?? 0,
        loanBurdenPercentage: input.loanBurdenPercentage ?? null,
        rawInsight:
          input.rawInsight === undefined
            ? undefined
            : input.rawInsight === null
              ? Prisma.JsonNull
              : input.rawInsight,
      },
    });

    return this.toResponse(record);
  }

  async getById(id: string) {
    const record = await prisma.incomeInsight.findUnique({ where: { id } });
    if (!record) {
      throw new Error("Income insight not found");
    }
    return this.toResponse(record);
  }

  async list(buyerId?: string) {
    const records = await prisma.incomeInsight.findMany({
      where: buyerId ? { buyerId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toResponse(record));
  }

  async getByBuyerId(buyerId: string) {
    await this.ensureBuyerExists(buyerId);
    const records = await prisma.incomeInsight.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toResponse(record));
  }

  async update(id: string, input: UpdateIncomeInsightInput) {
    const existing = await prisma.incomeInsight.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Income insight not found");
    }

    const record = await prisma.incomeInsight.update({
      where: { id },
      data: {
        ...(input.monthlyIncome !== undefined && {
          monthlyIncome: input.monthlyIncome,
        }),
        ...(input.incomeStabilityVariance !== undefined && {
          incomeStabilityVariance: input.incomeStabilityVariance,
        }),
        ...(input.netCashFlowPercentage !== undefined && {
          netCashFlowPercentage: input.netCashFlowPercentage,
        }),
        ...(input.liquidityMonths !== undefined && {
          liquidityMonths: input.liquidityMonths,
        }),
        ...(input.nsfEvents !== undefined && { nsfEvents: input.nsfEvents }),
        ...(input.overdraftFrequency !== undefined && {
          overdraftFrequency: input.overdraftFrequency,
        }),
        ...(input.loanBurdenPercentage !== undefined && {
          loanBurdenPercentage: input.loanBurdenPercentage,
        }),
        ...(input.rawInsight !== undefined && {
          rawInsight:
            input.rawInsight === null ? Prisma.JsonNull : input.rawInsight,
        }),
      },
    });

    return this.toResponse(record);
  }

  async delete(id: string) {
    const existing = await prisma.incomeInsight.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Income insight not found");
    }

    await prisma.incomeInsight.delete({ where: { id } });
    return { id };
  }
}

export const incomeInsightService = new IncomeInsightService();
