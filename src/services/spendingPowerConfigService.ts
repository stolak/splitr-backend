import prisma from "../utils/prisma";

const DEFAULT_CONFIG_ID = "default";

export interface UpsertSpendingPowerConfigInput {
  allocationPercentage?: number;
  maximumExposure?: number;
}

export interface CreateRiskTierInput {
  configId?: string;
  minScore: number;
  maxScore: number;
  riskTier: string;
  multiplier: number;
  maximumExposureCap: number;
  treatment: string;
}

export interface UpdateRiskTierInput {
  minScore?: number;
  maxScore?: number;
  riskTier?: string;
  multiplier?: number;
  maximumExposureCap?: number;
  treatment?: string;
}

export interface CreateBehaviourTierInput {
  configId?: string;
  minScore: number;
  maxScore: number;
  behaviourTier: string;
  multiplier: number;
  treatment: string;
}

export interface UpdateBehaviourTierInput {
  minScore?: number;
  maxScore?: number;
  behaviourTier?: string;
  multiplier?: number;
  treatment?: string;
}

export class SpendingPowerConfigService {
  private toConfigResponse(record: any) {
    return {
      ...record,
      allocationPercentage: Number(record.allocationPercentage),
      maximumExposure: Number(record.maximumExposure),
      riskTiers: (record.riskTiers ?? []).map((tier: any) => this.toRiskTierResponse(tier)),
      behaviourTiers: (record.behaviourTiers ?? []).map((tier: any) =>
        this.toBehaviourTierResponse(tier)
      ),
    };
  }

  private toRiskTierResponse(tier: any) {
    return {
      ...tier,
      multiplier: Number(tier.multiplier),
      maximumExposureCap: Number(tier.maximumExposureCap),
    };
  }

  private toBehaviourTierResponse(tier: any) {
    return {
      ...tier,
      multiplier: Number(tier.multiplier),
    };
  }

  private validateScoreRange(minScore: number, maxScore: number) {
    if (!Number.isFinite(minScore) || !Number.isFinite(maxScore)) {
      throw new Error("minScore and maxScore must be valid numbers");
    }
    if (minScore > maxScore) {
      throw new Error("minScore must be less than or equal to maxScore");
    }
  }

  async getConfig(configId: string = DEFAULT_CONFIG_ID) {
    const record = await prisma.spendingPowerConfig.findUnique({
      where: { id: configId },
      include: {
        riskTiers: { orderBy: { minScore: "desc" } },
        behaviourTiers: { orderBy: { minScore: "desc" } },
      },
    });

    if (!record) {
      return null;
    }

    return this.toConfigResponse(record);
  }

  async upsertConfig(
    input: UpsertSpendingPowerConfigInput,
    configId: string = DEFAULT_CONFIG_ID
  ) {
    if (
      input.allocationPercentage === undefined &&
      input.maximumExposure === undefined
    ) {
      throw new Error("At least one of allocationPercentage or maximumExposure is required");
    }

    if (
      input.allocationPercentage !== undefined &&
      (input.allocationPercentage < 0 || input.allocationPercentage > 1)
    ) {
      throw new Error("allocationPercentage must be between 0 and 1");
    }

    if (input.maximumExposure !== undefined && input.maximumExposure < 0) {
      throw new Error("maximumExposure cannot be negative");
    }

    const record = await prisma.spendingPowerConfig.upsert({
      where: { id: configId },
      create: {
        id: configId,
        allocationPercentage: input.allocationPercentage ?? 0.3,
        maximumExposure: input.maximumExposure ?? 500000,
      },
      update: {
        ...(input.allocationPercentage !== undefined && {
          allocationPercentage: input.allocationPercentage,
        }),
        ...(input.maximumExposure !== undefined && {
          maximumExposure: input.maximumExposure,
        }),
      },
      include: {
        riskTiers: { orderBy: { minScore: "desc" } },
        behaviourTiers: { orderBy: { minScore: "desc" } },
      },
    });

    return this.toConfigResponse(record);
  }

  async deleteConfig(configId: string = DEFAULT_CONFIG_ID) {
    const existing = await prisma.spendingPowerConfig.findUnique({
      where: { id: configId },
    });

    if (!existing) {
      throw new Error("Spending power config not found");
    }

    await prisma.spendingPowerConfig.delete({
      where: { id: configId },
    });

    return { id: configId };
  }

  // ==================== RISK TIERS ====================

  async listRiskTiers(configId: string = DEFAULT_CONFIG_ID) {
    const tiers = await prisma.spendingPowerRiskTier.findMany({
      where: { configId },
      orderBy: { minScore: "desc" },
    });

    return tiers.map((tier) => this.toRiskTierResponse(tier));
  }

  async getRiskTierById(id: string) {
    const tier = await prisma.spendingPowerRiskTier.findUnique({
      where: { id },
    });

    if (!tier) {
      throw new Error("Risk tier not found");
    }

    return this.toRiskTierResponse(tier);
  }

  async createRiskTier(input: CreateRiskTierInput) {
    this.validateScoreRange(input.minScore, input.maxScore);

    if (
      !Number.isFinite(input.maximumExposureCap) ||
      input.maximumExposureCap < 0
    ) {
      throw new Error("maximumExposureCap must be a non-negative number");
    }

    const configId = input.configId ?? DEFAULT_CONFIG_ID;
    await this.ensureConfigExists(configId);

    const tier = await prisma.spendingPowerRiskTier.create({
      data: {
        configId,
        minScore: input.minScore,
        maxScore: input.maxScore,
        riskTier: input.riskTier,
        multiplier: input.multiplier,
        maximumExposureCap: input.maximumExposureCap,
        treatment: input.treatment,
      },
    });

    return this.toRiskTierResponse(tier);
  }

  async updateRiskTier(id: string, input: UpdateRiskTierInput) {
    const existing = await prisma.spendingPowerRiskTier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Risk tier not found");
    }

    const minScore = input.minScore ?? existing.minScore;
    const maxScore = input.maxScore ?? existing.maxScore;
    this.validateScoreRange(minScore, maxScore);

    if (
      input.maximumExposureCap !== undefined &&
      (!Number.isFinite(input.maximumExposureCap) || input.maximumExposureCap < 0)
    ) {
      throw new Error("maximumExposureCap must be a non-negative number");
    }

    const tier = await prisma.spendingPowerRiskTier.update({
      where: { id },
      data: {
        ...(input.minScore !== undefined && { minScore: input.minScore }),
        ...(input.maxScore !== undefined && { maxScore: input.maxScore }),
        ...(input.riskTier !== undefined && { riskTier: input.riskTier }),
        ...(input.multiplier !== undefined && { multiplier: input.multiplier }),
        ...(input.maximumExposureCap !== undefined && {
          maximumExposureCap: input.maximumExposureCap,
        }),
        ...(input.treatment !== undefined && { treatment: input.treatment }),
      },
    });

    return this.toRiskTierResponse(tier);
  }

  async deleteRiskTier(id: string) {
    const existing = await prisma.spendingPowerRiskTier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Risk tier not found");
    }

    await prisma.spendingPowerRiskTier.delete({ where: { id } });
    return { id };
  }

  // ==================== BEHAVIOUR TIERS ====================

  async listBehaviourTiers(configId: string = DEFAULT_CONFIG_ID) {
    const tiers = await prisma.spendingPowerBehaviourTier.findMany({
      where: { configId },
      orderBy: { minScore: "desc" },
    });

    return tiers.map((tier) => this.toBehaviourTierResponse(tier));
  }

  async getBehaviourTierById(id: string) {
    const tier = await prisma.spendingPowerBehaviourTier.findUnique({
      where: { id },
    });

    if (!tier) {
      throw new Error("Behaviour tier not found");
    }

    return this.toBehaviourTierResponse(tier);
  }

  async createBehaviourTier(input: CreateBehaviourTierInput) {
    this.validateScoreRange(input.minScore, input.maxScore);

    const configId = input.configId ?? DEFAULT_CONFIG_ID;
    await this.ensureConfigExists(configId);

    const tier = await prisma.spendingPowerBehaviourTier.create({
      data: {
        configId,
        minScore: input.minScore,
        maxScore: input.maxScore,
        behaviourTier: input.behaviourTier,
        multiplier: input.multiplier,
        treatment: input.treatment,
      },
    });

    return this.toBehaviourTierResponse(tier);
  }

  async updateBehaviourTier(id: string, input: UpdateBehaviourTierInput) {
    const existing = await prisma.spendingPowerBehaviourTier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Behaviour tier not found");
    }

    const minScore = input.minScore ?? existing.minScore;
    const maxScore = input.maxScore ?? existing.maxScore;
    this.validateScoreRange(minScore, maxScore);

    const tier = await prisma.spendingPowerBehaviourTier.update({
      where: { id },
      data: {
        ...(input.minScore !== undefined && { minScore: input.minScore }),
        ...(input.maxScore !== undefined && { maxScore: input.maxScore }),
        ...(input.behaviourTier !== undefined && {
          behaviourTier: input.behaviourTier,
        }),
        ...(input.multiplier !== undefined && { multiplier: input.multiplier }),
        ...(input.treatment !== undefined && { treatment: input.treatment }),
      },
    });

    return this.toBehaviourTierResponse(tier);
  }

  async deleteBehaviourTier(id: string) {
    const existing = await prisma.spendingPowerBehaviourTier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Behaviour tier not found");
    }

    await prisma.spendingPowerBehaviourTier.delete({ where: { id } });
    return { id };
  }

  private async ensureConfigExists(configId: string) {
    const config = await prisma.spendingPowerConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      throw new Error(`Spending power config '${configId}' not found`);
    }
  }
}

export const spendingPowerConfigService = new SpendingPowerConfigService();
