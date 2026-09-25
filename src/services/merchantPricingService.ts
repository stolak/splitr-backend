import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

const merchantSelect = { id: true, businessName: true, splitrId: true } as const;
const productSelect = {
  id: true,
  code: true,
  productName: true,
  productType: true,
} as const;
const tierSelect = { id: true, label: true } as const;

const tierInclude = {
  tCutOffs: { orderBy: { dayPlus: "asc" as const } },
  rollingReserves: {
    include: { productConfiguration: { select: productSelect } },
    orderBy: { createdAt: "desc" as const },
  },
  instantPayoutSettings: true,
} satisfies Prisma.MerchantTierInclude;

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function optionalText(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`);
  }
  return value.trim() || null;
}

function requireNumber(value: unknown, field: string): number {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new Error(`${field} must be a number`);
  }
  return parsed;
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  return requireNumber(value, field);
}

function requireInt(value: unknown, field: string): number {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isInteger(parsed)) {
    throw new Error(`${field} must be an integer`);
  }
  return parsed;
}

function optionalInt(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  return requireInt(value, field);
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be a boolean`);
  }
  return value;
}

function asNumber(value: Prisma.Decimal | number | string): number {
  return Number(value);
}

async function write<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("A record with these values already exists");
      }
      if (error.code === "P2003") {
        throw new Error("Related record was not found");
      }
    }
    throw error;
  }
}

function mapFeesRate<T extends { rate: Prisma.Decimal }>(record: T) {
  return { ...record, rate: asNumber(record.rate) };
}

function mapReserve<T extends { rate: Prisma.Decimal }>(record: T) {
  return { ...record, rate: asNumber(record.rate) };
}

function mapInstant<T extends {
  baseRate: Prisma.Decimal;
  surchargeRate: Prisma.Decimal;
  maxPayoutPercentage: Prisma.Decimal;
}>(record: T) {
  return {
    ...record,
    baseRate: asNumber(record.baseRate),
    surchargeRate: asNumber(record.surchargeRate),
    maxPayoutPercentage: asNumber(record.maxPayoutPercentage),
  };
}

function mapDefaultFees<T extends { rate: Prisma.Decimal }>(record: T) {
  return { ...record, rate: asNumber(record.rate) };
}

function mapTier<T extends {
  rollingReserves?: Array<{ rate: Prisma.Decimal }>;
  instantPayoutSettings?: {
    baseRate: Prisma.Decimal;
    surchargeRate: Prisma.Decimal;
    maxPayoutPercentage: Prisma.Decimal;
  } | null;
}>(record: T) {
  return {
    ...record,
    rollingReserves: record.rollingReserves?.map((reserve) => mapReserve(reserve)),
    instantPayoutSettings: record.instantPayoutSettings
      ? mapInstant(record.instantPayoutSettings)
      : record.instantPayoutSettings,
  };
}

export class MerchantPricingService {
  private async assertMerchant(id: string) {
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!merchant) throw new Error("Merchant not found");
  }

  private async assertProductConfiguration(id: string) {
    const product = await prisma.productConfiguration.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!product) throw new Error("Product configuration not found");
  }

  private async assertMerchantTier(id: string) {
    const tier = await prisma.merchantTier.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!tier) throw new Error("Merchant tier not found");
  }

  async listFeesRates(filters: { merchantId?: string; productConfigurationId?: string }) {
    const records = await prisma.merchantFeesRate.findMany({
      where: {
        ...(filters.merchantId && { merchantId: filters.merchantId }),
        ...(filters.productConfigurationId && {
          productConfigurationId: filters.productConfigurationId,
        }),
      },
      include: {
        merchant: { select: merchantSelect },
        productConfiguration: { select: productSelect },
      },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => mapFeesRate(record));
  }

  async getFeesRate(id: string) {
    const record = await prisma.merchantFeesRate.findUnique({
      where: { id },
      include: {
        merchant: { select: merchantSelect },
        productConfiguration: { select: productSelect },
      },
    });
    return record ? mapFeesRate(record) : null;
  }

  async createFeesRate(input: {
    merchantId?: unknown;
    productConfigurationId?: unknown;
    rate?: unknown;
  }) {
    const merchantId = requireText(input.merchantId, "merchantId");
    const productConfigurationId = requireText(
      input.productConfigurationId,
      "productConfigurationId"
    );
    const rate = requireNumber(input.rate, "rate");

    await this.assertMerchant(merchantId);
    await this.assertProductConfiguration(productConfigurationId);

    const duplicate = await prisma.merchantFeesRate.findFirst({
      where: { merchantId, productConfigurationId },
      select: { id: true },
    });
    if (duplicate) {
      throw new Error(
        "A merchant fees rate already exists for this merchant and product configuration"
      );
    }

    const record = await write(() =>
      prisma.merchantFeesRate.create({
        data: { merchantId, productConfigurationId, rate },
        include: {
          merchant: { select: merchantSelect },
          productConfiguration: { select: productSelect },
        },
      })
    );
    return mapFeesRate(record);
  }

  async updateFeesRate(
    id: string,
    input: { merchantId?: unknown; productConfigurationId?: unknown; rate?: unknown }
  ) {
    const existing = await prisma.merchantFeesRate.findUnique({ where: { id } });
    if (!existing) throw new Error("Merchant fees rate not found");

    const merchantId =
      input.merchantId === undefined ? existing.merchantId : requireText(input.merchantId, "merchantId");
    const productConfigurationId =
      input.productConfigurationId === undefined
        ? existing.productConfigurationId
        : requireText(input.productConfigurationId, "productConfigurationId");
    const rate = optionalNumber(input.rate, "rate");

    if (
      input.merchantId === undefined &&
      input.productConfigurationId === undefined &&
      rate === undefined
    ) {
      throw new Error("At least one field is required");
    }

    if (merchantId !== existing.merchantId) await this.assertMerchant(merchantId);
    if (productConfigurationId !== existing.productConfigurationId) {
      await this.assertProductConfiguration(productConfigurationId);
    }

    if (
      merchantId !== existing.merchantId ||
      productConfigurationId !== existing.productConfigurationId
    ) {
      const duplicate = await prisma.merchantFeesRate.findFirst({
        where: { merchantId, productConfigurationId, id: { not: id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new Error(
          "A merchant fees rate already exists for this merchant and product configuration"
        );
      }
    }

    const record = await write(() =>
      prisma.merchantFeesRate.update({
        where: { id },
        data: {
          merchantId,
          productConfigurationId,
          ...(rate !== undefined && { rate }),
        },
        include: {
          merchant: { select: merchantSelect },
          productConfiguration: { select: productSelect },
        },
      })
    );
    return mapFeesRate(record);
  }

  async deleteFeesRate(id: string) {
    const existing = await prisma.merchantFeesRate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Merchant fees rate not found");
    await prisma.merchantFeesRate.delete({ where: { id } });
    return { id };
  }

  async listTiers() {
    const records = await prisma.merchantTier.findMany({
      include: tierInclude,
      orderBy: { label: "asc" },
    });
    return records.map((record) => mapTier(record));
  }

  async getTier(id: string) {
    const record = await prisma.merchantTier.findUnique({
      where: { id },
      include: tierInclude,
    });
    return record ? mapTier(record) : null;
  }

  async createTier(input: {
    label?: unknown;
    description?: unknown;
    rollingMaturityDay?: unknown;
  }) {
    const label = requireText(input.label, "label");
    const description = optionalText(input.description, "description");
    const rollingMaturityDay = requireInt(input.rollingMaturityDay, "rollingMaturityDay");

    const record = await write(() =>
      prisma.merchantTier.create({
        data: {
          label,
          description: description ?? null,
          rollingMaturityDay,
        },
        include: tierInclude,
      })
    );
    return mapTier(record);
  }

  async updateTier(
    id: string,
    input: { label?: unknown; description?: unknown; rollingMaturityDay?: unknown }
  ) {
    const existing = await prisma.merchantTier.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Merchant tier not found");

    const label = input.label === undefined ? undefined : requireText(input.label, "label");
    const description = optionalText(input.description, "description");
    const rollingMaturityDay = optionalInt(input.rollingMaturityDay, "rollingMaturityDay");

    if (label === undefined && description === undefined && rollingMaturityDay === undefined) {
      throw new Error("At least one field is required");
    }

    const record = await write(() =>
      prisma.merchantTier.update({
        where: { id },
        data: {
          ...(label !== undefined && { label }),
          ...(description !== undefined && { description }),
          ...(rollingMaturityDay !== undefined && { rollingMaturityDay }),
        },
        include: tierInclude,
      })
    );
    return mapTier(record);
  }

  async deleteTier(id: string) {
    const existing = await prisma.merchantTier.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Merchant tier not found");
    await prisma.merchantTier.delete({ where: { id } });
    return { id };
  }

  async listCutOffs(merchantTierId?: string) {
    return prisma.tCutOff.findMany({
      where: merchantTierId ? { merchantTierId } : undefined,
      include: { merchantTier: { select: tierSelect } },
      orderBy: [{ dayPlus: "asc" }, { label: "asc" }],
    });
  }

  async getCutOff(id: string) {
    return prisma.tCutOff.findUnique({
      where: { id },
      include: { merchantTier: { select: tierSelect } },
    });
  }

  async createCutOff(input: { merchantTierId?: unknown; label?: unknown; dayPlus?: unknown }) {
    const merchantTierId = requireText(input.merchantTierId, "merchantTierId");
    const label = requireText(input.label, "label");
    const dayPlus = requireInt(input.dayPlus, "dayPlus");
    await this.assertMerchantTier(merchantTierId);

    return write(() =>
      prisma.tCutOff.create({
        data: { merchantTierId, label, dayPlus },
        include: { merchantTier: { select: tierSelect } },
      })
    );
  }

  async updateCutOff(
    id: string,
    input: { merchantTierId?: unknown; label?: unknown; dayPlus?: unknown }
  ) {
    const existing = await prisma.tCutOff.findUnique({ where: { id } });
    if (!existing) throw new Error("T cut off not found");

    const merchantTierId =
      input.merchantTierId === undefined
        ? undefined
        : requireText(input.merchantTierId, "merchantTierId");
    const label = input.label === undefined ? undefined : requireText(input.label, "label");
    const dayPlus = optionalInt(input.dayPlus, "dayPlus");

    if (merchantTierId === undefined && label === undefined && dayPlus === undefined) {
      throw new Error("At least one field is required");
    }

    if (merchantTierId && merchantTierId !== existing.merchantTierId) {
      await this.assertMerchantTier(merchantTierId);
    }

    return write(() =>
      prisma.tCutOff.update({
        where: { id },
        data: {
          ...(merchantTierId !== undefined && { merchantTierId }),
          ...(label !== undefined && { label }),
          ...(dayPlus !== undefined && { dayPlus }),
        },
        include: { merchantTier: { select: tierSelect } },
      })
    );
  }

  async deleteCutOff(id: string) {
    const existing = await prisma.tCutOff.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("T cut off not found");
    await prisma.tCutOff.delete({ where: { id } });
    return { id };
  }

  async listReserves(filters: { merchantTierId?: string; productConfigurationId?: string }) {
    const records = await prisma.rollingReserve.findMany({
      where: {
        ...(filters.merchantTierId && { merchantTierId: filters.merchantTierId }),
        ...(filters.productConfigurationId && {
          productConfigurationId: filters.productConfigurationId,
        }),
      },
      include: {
        merchantTier: { select: tierSelect },
        productConfiguration: { select: productSelect },
      },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => mapReserve(record));
  }

  async getReserve(id: string) {
    const record = await prisma.rollingReserve.findUnique({
      where: { id },
      include: {
        merchantTier: { select: tierSelect },
        productConfiguration: { select: productSelect },
      },
    });
    return record ? mapReserve(record) : null;
  }

  async createReserve(input: {
    merchantTierId?: unknown;
    productConfigurationId?: unknown;
    rate?: unknown;
  }) {
    const merchantTierId = requireText(input.merchantTierId, "merchantTierId");
    const productConfigurationId = requireText(
      input.productConfigurationId,
      "productConfigurationId"
    );
    const rate = requireNumber(input.rate, "rate");

    await this.assertMerchantTier(merchantTierId);
    await this.assertProductConfiguration(productConfigurationId);

    const duplicate = await prisma.rollingReserve.findFirst({
      where: { merchantTierId, productConfigurationId },
      select: { id: true },
    });
    if (duplicate) {
      throw new Error(
        "A rolling reserve already exists for this merchant tier and product configuration"
      );
    }

    const record = await write(() =>
      prisma.rollingReserve.create({
        data: { merchantTierId, productConfigurationId, rate },
        include: {
          merchantTier: { select: tierSelect },
          productConfiguration: { select: productSelect },
        },
      })
    );
    return mapReserve(record);
  }

  async updateReserve(
    id: string,
    input: { merchantTierId?: unknown; productConfigurationId?: unknown; rate?: unknown }
  ) {
    const existing = await prisma.rollingReserve.findUnique({ where: { id } });
    if (!existing) throw new Error("Rolling reserve not found");

    const merchantTierId =
      input.merchantTierId === undefined
        ? existing.merchantTierId
        : requireText(input.merchantTierId, "merchantTierId");
    const productConfigurationId =
      input.productConfigurationId === undefined
        ? existing.productConfigurationId
        : requireText(input.productConfigurationId, "productConfigurationId");
    const rate = optionalNumber(input.rate, "rate");

    if (
      input.merchantTierId === undefined &&
      input.productConfigurationId === undefined &&
      rate === undefined
    ) {
      throw new Error("At least one field is required");
    }

    if (merchantTierId !== existing.merchantTierId) await this.assertMerchantTier(merchantTierId);
    if (productConfigurationId !== existing.productConfigurationId) {
      await this.assertProductConfiguration(productConfigurationId);
    }

    if (
      merchantTierId !== existing.merchantTierId ||
      productConfigurationId !== existing.productConfigurationId
    ) {
      const duplicate = await prisma.rollingReserve.findFirst({
        where: { merchantTierId, productConfigurationId, id: { not: id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new Error(
          "A rolling reserve already exists for this merchant tier and product configuration"
        );
      }
    }

    const record = await write(() =>
      prisma.rollingReserve.update({
        where: { id },
        data: {
          merchantTierId,
          productConfigurationId,
          ...(rate !== undefined && { rate }),
        },
        include: {
          merchantTier: { select: tierSelect },
          productConfiguration: { select: productSelect },
        },
      })
    );
    return mapReserve(record);
  }

  async deleteReserve(id: string) {
    const existing = await prisma.rollingReserve.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Rolling reserve not found");
    await prisma.rollingReserve.delete({ where: { id } });
    return { id };
  }

  async listInstantSettings(merchantTierId?: string) {
    const records = await prisma.merchantInstantPayoutSettings.findMany({
      where: merchantTierId ? { merchantTierId } : undefined,
      include: { merchantTier: { select: tierSelect } },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => mapInstant(record));
  }

  async getInstantSettings(id: string) {
    const record = await prisma.merchantInstantPayoutSettings.findUnique({
      where: { id },
      include: { merchantTier: { select: tierSelect } },
    });
    return record ? mapInstant(record) : null;
  }

  async getInstantSettingsByTier(merchantTierId: string) {
    const record = await prisma.merchantInstantPayoutSettings.findUnique({
      where: { merchantTierId },
      include: { merchantTier: { select: tierSelect } },
    });
    return record ? mapInstant(record) : null;
  }

  async createInstantSettings(input: {
    merchantTierId?: unknown;
    baseRate?: unknown;
    surchargeRate?: unknown;
    maxPayoutPercentage?: unknown;
    isEnabled?: unknown;
  }) {
    const merchantTierId = requireText(input.merchantTierId, "merchantTierId");
    const baseRate = requireNumber(input.baseRate, "baseRate");
    const surchargeRate = requireNumber(input.surchargeRate, "surchargeRate");
    const maxPayoutPercentage = requireNumber(input.maxPayoutPercentage, "maxPayoutPercentage");
    const isEnabled = optionalBoolean(input.isEnabled, "isEnabled") ?? false;

    await this.assertMerchantTier(merchantTierId);

    const duplicate = await prisma.merchantInstantPayoutSettings.findUnique({
      where: { merchantTierId },
      select: { id: true },
    });
    if (duplicate) {
      throw new Error("Instant payout settings already exist for this merchant tier");
    }

    const record = await write(() =>
      prisma.merchantInstantPayoutSettings.create({
        data: {
          merchantTierId,
          baseRate,
          surchargeRate,
          maxPayoutPercentage,
          isEnabled,
        },
        include: { merchantTier: { select: tierSelect } },
      })
    );
    return mapInstant(record);
  }

  async updateInstantSettings(
    id: string,
    input: {
      merchantTierId?: unknown;
      baseRate?: unknown;
      surchargeRate?: unknown;
      maxPayoutPercentage?: unknown;
      isEnabled?: unknown;
    }
  ) {
    const existing = await prisma.merchantInstantPayoutSettings.findUnique({ where: { id } });
    if (!existing) throw new Error("Instant payout settings not found");

    const merchantTierId =
      input.merchantTierId === undefined
        ? undefined
        : requireText(input.merchantTierId, "merchantTierId");
    const baseRate = optionalNumber(input.baseRate, "baseRate");
    const surchargeRate = optionalNumber(input.surchargeRate, "surchargeRate");
    const maxPayoutPercentage = optionalNumber(input.maxPayoutPercentage, "maxPayoutPercentage");
    const isEnabled = optionalBoolean(input.isEnabled, "isEnabled");

    if (
      merchantTierId === undefined &&
      baseRate === undefined &&
      surchargeRate === undefined &&
      maxPayoutPercentage === undefined &&
      isEnabled === undefined
    ) {
      throw new Error("At least one field is required");
    }

    if (merchantTierId && merchantTierId !== existing.merchantTierId) {
      await this.assertMerchantTier(merchantTierId);
      const duplicate = await prisma.merchantInstantPayoutSettings.findUnique({
        where: { merchantTierId },
        select: { id: true },
      });
      if (duplicate) {
        throw new Error("Instant payout settings already exist for this merchant tier");
      }
    }

    const record = await write(() =>
      prisma.merchantInstantPayoutSettings.update({
        where: { id },
        data: {
          ...(merchantTierId !== undefined && { merchantTierId }),
          ...(baseRate !== undefined && { baseRate }),
          ...(surchargeRate !== undefined && { surchargeRate }),
          ...(maxPayoutPercentage !== undefined && { maxPayoutPercentage }),
          ...(isEnabled !== undefined && { isEnabled }),
        },
        include: { merchantTier: { select: tierSelect } },
      })
    );
    return mapInstant(record);
  }

  async deleteInstantSettings(id: string) {
    const existing = await prisma.merchantInstantPayoutSettings.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Instant payout settings not found");
    await prisma.merchantInstantPayoutSettings.delete({ where: { id } });
    return { id };
  }

  async listDefaultFeesRates(productConfigurationId?: string) {
    const records = await prisma.merchantDefaultFeesRate.findMany({
      where: productConfigurationId ? { productConfigurationId } : undefined,
      include: { productConfiguration: { select: productSelect } },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => mapDefaultFees(record));
  }

  async getDefaultFeesRate(id: string) {
    const record = await prisma.merchantDefaultFeesRate.findUnique({
      where: { id },
      include: { productConfiguration: { select: productSelect } },
    });
    return record ? mapDefaultFees(record) : null;
  }

  async getDefaultFeesRateByProduct(productConfigurationId: string) {
    const record = await prisma.merchantDefaultFeesRate.findUnique({
      where: { productConfigurationId },
      include: { productConfiguration: { select: productSelect } },
    });
    return record ? mapDefaultFees(record) : null;
  }

  async createDefaultFeesRate(input: { productConfigurationId?: unknown; rate?: unknown }) {
    const productConfigurationId = requireText(
      input.productConfigurationId,
      "productConfigurationId"
    );
    const rate = requireNumber(input.rate, "rate");
    await this.assertProductConfiguration(productConfigurationId);

    const duplicate = await prisma.merchantDefaultFeesRate.findUnique({
      where: { productConfigurationId },
      select: { id: true },
    });
    if (duplicate) {
      throw new Error("A default fees rate already exists for this product configuration");
    }

    const record = await write(() =>
      prisma.merchantDefaultFeesRate.create({
        data: { productConfigurationId, rate },
        include: { productConfiguration: { select: productSelect } },
      })
    );
    return mapDefaultFees(record);
  }

  async updateDefaultFeesRate(
    id: string,
    input: { productConfigurationId?: unknown; rate?: unknown }
  ) {
    const existing = await prisma.merchantDefaultFeesRate.findUnique({ where: { id } });
    if (!existing) throw new Error("Default fees rate not found");

    const productConfigurationId =
      input.productConfigurationId === undefined
        ? undefined
        : requireText(input.productConfigurationId, "productConfigurationId");
    const rate = optionalNumber(input.rate, "rate");

    if (productConfigurationId === undefined && rate === undefined) {
      throw new Error("At least one field is required");
    }

    if (
      productConfigurationId &&
      productConfigurationId !== existing.productConfigurationId
    ) {
      await this.assertProductConfiguration(productConfigurationId);
      const duplicate = await prisma.merchantDefaultFeesRate.findUnique({
        where: { productConfigurationId },
        select: { id: true },
      });
      if (duplicate) {
        throw new Error("A default fees rate already exists for this product configuration");
      }
    }

    const record = await write(() =>
      prisma.merchantDefaultFeesRate.update({
        where: { id },
        data: {
          ...(productConfigurationId !== undefined && { productConfigurationId }),
          ...(rate !== undefined && { rate }),
        },
        include: { productConfiguration: { select: productSelect } },
      })
    );
    return mapDefaultFees(record);
  }

  async deleteDefaultFeesRate(id: string) {
    const existing = await prisma.merchantDefaultFeesRate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Default fees rate not found");
    await prisma.merchantDefaultFeesRate.delete({ where: { id } });
    return { id };
  }
}

export const merchantPricingService = new MerchantPricingService();
