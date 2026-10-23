import {
  CampaignEligibility,
  CampaignFinancingOption,
  CampaignFunding,
  CampaignInitiatedBy,
  CampaignPromoType,
  CampaignStatus,
  CampaignChannel,
  Prisma,
} from "@prisma/client";
import { randomBytes } from "crypto";
import prisma from "../utils/prisma";

const INITIATED_BY = Object.values(CampaignInitiatedBy);
const ELIGIBILITY = Object.values(CampaignEligibility);
const PROMO_TYPES = Object.values(CampaignPromoType);
const FUNDING = Object.values(CampaignFunding);
const STATUSES = Object.values(CampaignStatus);
const CHANNELS = Object.values(CampaignChannel);
const FINANCING = Object.values(CampaignFinancingOption);

type CampaignMerchantEntry = {
  merchantId: string;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  approvedRemarks: string | null;
};

type ProductDiscount = {
  fixed?: number | null;
  percentage?: number | null;
};

type ProductFinancingEntry = {
  product: CampaignFinancingOption;
  reducedPercentage?: number | null;
  productDiscount?: ProductDiscount | null;
};

const CHANNEL_ALIASES: Record<string, CampaignChannel> = {
  OnlineStoreWebsite: CampaignChannel.OnlineStoreWebsite,
  "Online store / Website": CampaignChannel.OnlineStoreWebsite,
  InStorePOS: CampaignChannel.InStorePOS,
  "In-store (POS)": CampaignChannel.InStorePOS,
  PaymentLinkInvoice: CampaignChannel.PaymentLinkInvoice,
  "Payment link / Invoice": CampaignChannel.PaymentLinkInvoice,
};

const FINANCING_ALIASES: Record<string, CampaignFinancingOption> = {
  PayIn4: CampaignFinancingOption.PayIn4,
  "Pay-in-4 (P4)": CampaignFinancingOption.PayIn4,
  PayIn6: CampaignFinancingOption.PayIn6,
  "Pay-in-6 (P6)": CampaignFinancingOption.PayIn6,
  MonthlyFlex: CampaignFinancingOption.MonthlyFlex,
  "Monthly Flex (MF)": CampaignFinancingOption.MonthlyFlex,
};

const ELIGIBILITY_ALIASES: Record<string, CampaignEligibility> = {
  AllCustomers: CampaignEligibility.AllCustomers,
  "All customers": CampaignEligibility.AllCustomers,
  NewCustomer: CampaignEligibility.NewCustomer,
  "New customer": CampaignEligibility.NewCustomer,
  ReturningCustomer: CampaignEligibility.ReturningCustomer,
  "Returning customer": CampaignEligibility.ReturningCustomer,
};

const FUNDING_ALIASES: Record<string, CampaignFunding> = {
  MerchantFunded: CampaignFunding.MerchantFunded,
  "Merchant funded": CampaignFunding.MerchantFunded,
  SplitrFunded: CampaignFunding.SplitrFunded,
  "Splitr funded": CampaignFunding.SplitrFunded,
  MerchantAndSplitrFunded: CampaignFunding.MerchantAndSplitrFunded,
  "Merchant and Splitr funded": CampaignFunding.MerchantAndSplitrFunded,
};

const PROMO_ALIASES: Record<string, CampaignPromoType> = {
  PurchaseDiscount: CampaignPromoType.PurchaseDiscount,
  "Purchase discount": CampaignPromoType.PurchaseDiscount,
  FixedAmountOff: CampaignPromoType.FixedAmountOff,
  "Fixed amount off": CampaignPromoType.FixedAmountOff,
  Mixed: CampaignPromoType.Mixed,
  mixed: CampaignPromoType.Mixed,
};

const campaignInclude = {
  merchant: { select: { id: true, businessName: true, splitrId: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.CampaignInclude;

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function optionalText(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const trimmed = value.trim();
  return trimmed || null;
}

function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  aliases?: Record<string, T>
): T {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  const raw = value.trim();
  if (aliases?.[raw]) return aliases[raw];
  if (!allowed.includes(raw as T)) {
    throw new Error(`${field} must be ${allowed.join(", ")}`);
  }
  return raw as T;
}

function optionalEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  aliases?: Record<string, T>
): T | undefined {
  if (value === undefined) return undefined;
  return requireEnum(value, field, allowed, aliases);
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${field} must be a boolean`);
  return value;
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  return requireBoolean(value, field);
}

function requireNumber(value: unknown, field: string): number {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new Error(`${field} must be a number`);
  }
  return parsed;
}

function optionalNumber(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return requireNumber(value, field);
}

function requireDate(value: unknown, field: string): Date {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${field} is required`);
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error(`${field} must be a valid date`);
  return date;
}

function parseEnumArray<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  aliases: Record<string, T>
): T[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  return value.map((entry, index) =>
    requireEnum(entry, `${field}[${index}]`, allowed, aliases)
  );
}

function parseOutletIds(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("outletIds must be an array");
  return value.map((entry, index) => {
    if (typeof entry !== "string" || !entry.trim()) {
      throw new Error(`outletIds[${index}] must be a non-empty string`);
    }
    return entry.trim();
  });
}

function asMerchantEntries(value: Prisma.JsonValue | null | undefined): CampaignMerchantEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const row = entry as Record<string, unknown>;
      if (typeof row.merchantId !== "string" || !row.merchantId.trim()) return null;
      return {
        merchantId: row.merchantId.trim(),
        approved: Boolean(row.approved),
        approvedBy: typeof row.approvedBy === "string" ? row.approvedBy : null,
        approvedAt: typeof row.approvedAt === "string" ? row.approvedAt : null,
        approvedRemarks: typeof row.approvedRemarks === "string" ? row.approvedRemarks : null,
      };
    })
    .filter((entry): entry is CampaignMerchantEntry => Boolean(entry));
}

function parseMerchantIds(value: unknown): CampaignMerchantEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("merchantIds must be an array");

  const seen = new Set<string>();
  return value.map((entry, index) => {
    if (typeof entry === "string") {
      const merchantId = entry.trim();
      if (!merchantId) throw new Error(`merchantIds[${index}] must be a non-empty string`);
      if (seen.has(merchantId)) throw new Error(`merchantIds[${index}] is duplicated`);
      seen.add(merchantId);
      return {
        merchantId,
        approved: false,
        approvedBy: null,
        approvedAt: null,
        approvedRemarks: null,
      };
    }

    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`merchantIds[${index}] must be a string or object`);
    }
    const row = entry as Record<string, unknown>;
    const merchantId = requireText(row.merchantId, `merchantIds[${index}].merchantId`);
    if (seen.has(merchantId)) throw new Error(`merchantIds[${index}] is duplicated`);
    seen.add(merchantId);

    return {
      merchantId,
      approved: typeof row.approved === "boolean" ? row.approved : false,
      approvedBy: typeof row.approvedBy === "string" ? row.approvedBy : null,
      approvedAt: typeof row.approvedAt === "string" ? row.approvedAt : null,
      approvedRemarks:
        typeof row.approvedRemarks === "string" ? row.approvedRemarks : null,
    };
  });
}

function parseProductFinancing(value: unknown): ProductFinancingEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("productFinancing must be an array");

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`productFinancing[${index}] must be an object`);
    }
    const row = entry as Record<string, unknown>;
    const product = requireEnum(
      row.product,
      `productFinancing[${index}].product`,
      FINANCING,
      FINANCING_ALIASES
    );
    const reducedPercentage = optionalNumber(
      row.reducedPercentage,
      `productFinancing[${index}].reducedPercentage`
    );

    let productDiscount: ProductDiscount | null = null;
    if (row.productDiscount !== undefined && row.productDiscount !== null) {
      if (typeof row.productDiscount !== "object" || Array.isArray(row.productDiscount)) {
        throw new Error(`productFinancing[${index}].productDiscount must be an object`);
      }
      const discount = row.productDiscount as Record<string, unknown>;
      productDiscount = {
        fixed: optionalNumber(discount.fixed, `productFinancing[${index}].productDiscount.fixed`) ?? null,
        percentage:
          optionalNumber(
            discount.percentage,
            `productFinancing[${index}].productDiscount.percentage`
          ) ?? null,
      };
    }

    return {
      product,
      reducedPercentage: reducedPercentage ?? null,
      productDiscount,
    };
  });
}

function parseSplittingRatio(value: unknown): Record<string, number> | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("splittingRatio must be an object");
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return {};

  const ratio: Record<string, number> = {};
  let total = 0;
  for (const [key, raw] of entries) {
    const name = key.trim();
    if (!name) throw new Error("splittingRatio keys must be non-empty strings");
    const amount = requireNumber(raw, `splittingRatio.${name}`);
    if (amount < 0 || amount > 1) {
      throw new Error(`splittingRatio.${name} must be between 0 and 1`);
    }
    ratio[name] = amount;
    total += amount;
  }

  if (Math.abs(total - 1) > 0.0001) {
    throw new Error("splittingRatio values must sum to 1");
  }
  return ratio;
}

function asSplittingRatio(value: Prisma.JsonValue | null | undefined): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const ratio: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const amount = Number(raw);
    if (Number.isFinite(amount)) ratio[key] = amount;
  }
  return ratio;
}

function moneyFields(record: {
  discountAmount: Prisma.Decimal | null;
  discountPercentage: Prisma.Decimal | null;
  minPurchase: Prisma.Decimal | null;
  budget: Prisma.Decimal | null;
}) {
  return {
    discountAmount: record.discountAmount === null ? null : Number(record.discountAmount),
    discountPercentage:
      record.discountPercentage === null ? null : Number(record.discountPercentage),
    minPurchase: record.minPurchase === null ? null : Number(record.minPurchase),
    budget: record.budget === null ? null : Number(record.budget),
  };
}

function mapCampaign<T extends {
  discountAmount: Prisma.Decimal | null;
  discountPercentage: Prisma.Decimal | null;
  minPurchase: Prisma.Decimal | null;
  budget: Prisma.Decimal | null;
  outletIds: Prisma.JsonValue | null;
  merchantIds: Prisma.JsonValue | null;
  channels: Prisma.JsonValue | null;
  financing: Prisma.JsonValue;
  productFinancing: Prisma.JsonValue;
  splittingRatio: Prisma.JsonValue | null;
}>(record: T) {
  return {
    ...record,
    ...moneyFields(record),
    outletIds: Array.isArray(record.outletIds) ? record.outletIds : [],
    merchantIds: asMerchantEntries(record.merchantIds),
    channels: Array.isArray(record.channels) ? record.channels : [],
    financing: Array.isArray(record.financing) ? record.financing : [],
    productFinancing: Array.isArray(record.productFinancing) ? record.productFinancing : [],
    splittingRatio: asSplittingRatio(record.splittingRatio),
  };
}

function assertPromoFields(
  promoType: CampaignPromoType,
  discountAmount: number | null | undefined,
  discountPercentage: number | null | undefined,
  productFinancing: ProductFinancingEntry[]
) {
  if (promoType === CampaignPromoType.FixedAmountOff) {
    if (discountAmount === undefined || discountAmount === null) {
      throw new Error("discountAmount is required when promoType is FixedAmountOff");
    }
    if (discountAmount <= 0) throw new Error("discountAmount must be greater than 0");
  }
  if (promoType === CampaignPromoType.PurchaseDiscount) {
    if (discountPercentage === undefined || discountPercentage === null) {
      throw new Error("discountPercentage is required when promoType is PurchaseDiscount");
    }
    if (discountPercentage <= 0 || discountPercentage > 100) {
      throw new Error("discountPercentage must be between 0 and 100");
    }
  }
  if (promoType === CampaignPromoType.Mixed && productFinancing.length === 0) {
    throw new Error("productFinancing is required when promoType is Mixed");
  }
}

async function assertMerchant(merchantId: string | null | undefined) {
  if (!merchantId) return;
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true },
  });
  if (!merchant) throw new Error("Merchant not found");
}

async function assertMerchants(merchantIds: string[]) {
  if (merchantIds.length === 0) return;
  const merchants = await prisma.merchant.findMany({
    where: { id: { in: merchantIds } },
    select: { id: true },
  });
  if (merchants.length !== merchantIds.length) {
    throw new Error("One or more merchants were not found");
  }
}

async function assertUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new Error("User not found");
}

async function assertOutlets(outletIds: string[], merchantId: string | null | undefined) {
  if (outletIds.length === 0) return;
  const outlets = await prisma.outlet.findMany({
    where: { id: { in: outletIds } },
    select: { id: true, merchantId: true },
  });
  if (outlets.length !== outletIds.length) {
    throw new Error("One or more outlets were not found");
  }
  if (merchantId) {
    const foreign = outlets.find((outlet) => outlet.merchantId !== merchantId);
    if (foreign) throw new Error("Outlet does not belong to this merchant");
  }
}

async function generateCampaignCode(): Promise<string> {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = randomBytes(4).toString("hex").toUpperCase();
    const campaignCode = `CMP-${yy}${mm}-${suffix}`;
    const existing = await prisma.campaign.findUnique({
      where: { campaignCode },
      select: { id: true },
    });
    if (!existing) return campaignCode;
  }
  throw new Error("Failed to generate campaign code");
}

export class CampaignService {
  async list(filters?: {
    merchantId?: string;
    status?: CampaignStatus;
    initiatedBy?: CampaignInitiatedBy;
    q?: string;
  }) {
    const where: Prisma.CampaignWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.initiatedBy) where.initiatedBy = filters.initiatedBy;
    if (filters?.q) {
      where.OR = [
        { name: { contains: filters.q } },
        { description: { contains: filters.q } },
        { campaignCode: { contains: filters.q } },
      ];
    }

    const records = await prisma.campaign.findMany({
      where,
      include: campaignInclude,
      orderBy: { createdAt: "desc" },
    });

    const mapped = records.map((record) => mapCampaign(record));
    if (!filters?.merchantId) return mapped;

    return mapped.filter((campaign) => this.isRelatedToMerchant(campaign, filters.merchantId!));
  }

  /**
   * Campaigns owned by the merchant, or where the merchant appears in merchantIds.
   */
  async listByMerchant(
    merchantId: string,
    filters?: { status?: CampaignStatus; initiatedBy?: CampaignInitiatedBy; q?: string }
  ) {
    await assertMerchant(merchantId);

    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT \`id\`
      FROM \`campaign\`
      WHERE \`merchantId\` = ${merchantId}
         OR JSON_SEARCH(COALESCE(\`merchantIds\`, JSON_ARRAY()), 'one', ${merchantId}, NULL, '$[*].merchantId') IS NOT NULL
      ORDER BY \`createdAt\` DESC
    `;

    if (rows.length === 0) return [];

    const where: Prisma.CampaignWhereInput = {
      id: { in: rows.map((row) => row.id) },
    };
    if (filters?.status) where.status = filters.status;
    if (filters?.initiatedBy) where.initiatedBy = filters.initiatedBy;
    if (filters?.q) {
      where.AND = [
        {
          OR: [
            { name: { contains: filters.q } },
            { description: { contains: filters.q } },
            { campaignCode: { contains: filters.q } },
          ],
        },
      ];
    }

    const records = await prisma.campaign.findMany({
      where,
      include: campaignInclude,
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => mapCampaign(record));
  }

  private isRelatedToMerchant(
    campaign: { merchantId: string | null; merchantIds: CampaignMerchantEntry[] },
    merchantId: string
  ) {
    return (
      campaign.merchantId === merchantId ||
      campaign.merchantIds.some((entry) => entry.merchantId === merchantId)
    );
  }

  async getById(id: string) {
    const record = await prisma.campaign.findUnique({
      where: { id },
      include: campaignInclude,
    });
    return record ? mapCampaign(record) : null;
  }

  async getByCode(campaignCode: string) {
    const record = await prisma.campaign.findUnique({
      where: { campaignCode: campaignCode.trim() },
      include: campaignInclude,
    });
    return record ? mapCampaign(record) : null;
  }

  async create(input: Record<string, unknown>, createdById: string) {
    await assertUser(createdById);

    const name = requireText(input.name, "name");
    if (name.length > 200) throw new Error("name must be at most 200 characters");

    const initiatedBy = requireEnum(input.initiatedBy, "initiatedBy", INITIATED_BY);
    const promoType = requireEnum(input.promoType, "promoType", PROMO_TYPES, PROMO_ALIASES);
    const funding = requireEnum(input.funding, "funding", FUNDING, FUNDING_ALIASES);
    const startDate = requireDate(input.startDate, "startDate");
    const endDate = requireDate(input.endDate, "endDate");
    if (endDate.getTime() < startDate.getTime()) {
      throw new Error("endDate must be on or after startDate");
    }

    const merchantId =
      input.merchantId === undefined || input.merchantId === null || input.merchantId === ""
        ? null
        : requireText(input.merchantId, "merchantId");
    await assertMerchant(merchantId);

    const outletIds = parseOutletIds(input.outletIds);
    await assertOutlets(outletIds, merchantId);

    const merchantIds = parseMerchantIds(input.merchantIds);
    await assertMerchants(merchantIds.map((entry) => entry.merchantId));

    const discountAmount = optionalNumber(input.discountAmount, "discountAmount");
    const discountPercentage = optionalNumber(input.discountPercentage, "discountPercentage");
    const productFinancing = parseProductFinancing(input.productFinancing);
    assertPromoFields(promoType, discountAmount, discountPercentage, productFinancing);
    const splittingRatio = parseSplittingRatio(input.splittingRatio) ?? {};

    const channels = parseEnumArray(input.channels, "channels", CHANNELS, CHANNEL_ALIASES);
    const financing = parseEnumArray(input.financing, "financing", FINANCING, FINANCING_ALIASES);
    const eligibility =
      optionalEnum(input.eligibility, "eligibility", ELIGIBILITY, ELIGIBILITY_ALIASES) ??
      CampaignEligibility.AllCustomers;
    const status = optionalEnum(input.status, "status", STATUSES) ?? CampaignStatus.Pending;
    const campaignCode = await generateCampaignCode();

    const record = await prisma.campaign.create({
      data: {
        merchantId,
        initiatedBy,
        name,
        description: optionalText(input.description, "description") ?? null,
        imageName: optionalText(input.imageName, "imageName") ?? null,
        outletIds,
        merchantIds,
        eligibility,
        channels,
        productScope: optionalText(input.productScope, "productScope") ?? "All products",
        promoType,
        discountAmount: discountAmount ?? null,
        discountPercentage: discountPercentage ?? null,
        minPurchase: optionalNumber(input.minPurchase, "minPurchase") ?? null,
        allProducts: optionalBoolean(input.allProducts, "allProducts") ?? true,
        stacking: optionalBoolean(input.stacking, "stacking") ?? false,
        financing,
        productFinancing,
        splittingRatio,
        funding,
        budget: optionalNumber(input.budget, "budget") ?? null,
        startDate,
        endDate,
        confirm: optionalBoolean(input.confirm, "confirm") ?? false,
        approved: optionalBoolean(input.approved, "approved") ?? false,
        status,
        campaignCode,
        createdById,
      },
      include: campaignInclude,
    });

    return mapCampaign(record);
  }

  async update(id: string, input: Record<string, unknown>) {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new Error("Campaign not found");

    const data: Prisma.CampaignUpdateInput = {};

    if (input.name !== undefined) {
      const name = requireText(input.name, "name");
      if (name.length > 200) throw new Error("name must be at most 200 characters");
      data.name = name;
    }
    if (input.description !== undefined) {
      data.description = optionalText(input.description, "description");
    }
    if (input.imageName !== undefined) {
      data.imageName = optionalText(input.imageName, "imageName");
    }
    if (input.initiatedBy !== undefined) {
      data.initiatedBy = requireEnum(input.initiatedBy, "initiatedBy", INITIATED_BY);
    }
    if (input.eligibility !== undefined) {
      data.eligibility = requireEnum(
        input.eligibility,
        "eligibility",
        ELIGIBILITY,
        ELIGIBILITY_ALIASES
      );
    }
    if (input.productScope !== undefined) {
      data.productScope = requireText(input.productScope, "productScope");
    }
    if (input.funding !== undefined) {
      data.funding = requireEnum(input.funding, "funding", FUNDING, FUNDING_ALIASES);
    }
    if (input.status !== undefined) {
      data.status = requireEnum(input.status, "status", STATUSES);
    }
    if (input.allProducts !== undefined) {
      data.allProducts = requireBoolean(input.allProducts, "allProducts");
    }
    if (input.stacking !== undefined) {
      data.stacking = requireBoolean(input.stacking, "stacking");
    }
    if (input.confirm !== undefined) {
      data.confirm = requireBoolean(input.confirm, "confirm");
    }
    if (input.approved !== undefined) {
      data.approved = requireBoolean(input.approved, "approved");
    }
    if (input.channels !== undefined) {
      data.channels = parseEnumArray(input.channels, "channels", CHANNELS, CHANNEL_ALIASES);
    }
    if (input.financing !== undefined) {
      data.financing = parseEnumArray(input.financing, "financing", FINANCING, FINANCING_ALIASES);
    }
    if (input.minPurchase !== undefined) {
      data.minPurchase = optionalNumber(input.minPurchase, "minPurchase");
    }
    if (input.budget !== undefined) {
      data.budget = optionalNumber(input.budget, "budget");
    }

    let merchantId =
      input.merchantId === undefined
        ? existing.merchantId
        : input.merchantId === null || input.merchantId === ""
          ? null
          : requireText(input.merchantId, "merchantId");
    if (input.merchantId !== undefined) {
      await assertMerchant(merchantId);
      data.merchant = merchantId ? { connect: { id: merchantId } } : { disconnect: true };
    }

    if (input.outletIds !== undefined) {
      const outletIds = parseOutletIds(input.outletIds);
      await assertOutlets(outletIds, merchantId);
      data.outletIds = outletIds;
    }

    if (input.merchantIds !== undefined) {
      const merchantIds = parseMerchantIds(input.merchantIds);
      await assertMerchants(merchantIds.map((entry) => entry.merchantId));
      data.merchantIds = merchantIds;
    }

    const productFinancing =
      input.productFinancing !== undefined
        ? parseProductFinancing(input.productFinancing)
        : (Array.isArray(existing.productFinancing)
            ? (existing.productFinancing as ProductFinancingEntry[])
            : []);
    if (input.productFinancing !== undefined) data.productFinancing = productFinancing;

    if (input.splittingRatio !== undefined) {
      const splittingRatio = parseSplittingRatio(input.splittingRatio);
      data.splittingRatio = splittingRatio === null ? Prisma.JsonNull : splittingRatio;
    }

    const promoType =
      input.promoType === undefined
        ? existing.promoType
        : requireEnum(input.promoType, "promoType", PROMO_TYPES, PROMO_ALIASES);
    if (input.promoType !== undefined) data.promoType = promoType;

    const discountAmount =
      input.discountAmount !== undefined
        ? optionalNumber(input.discountAmount, "discountAmount")
        : existing.discountAmount === null
          ? null
          : Number(existing.discountAmount);
    const discountPercentage =
      input.discountPercentage !== undefined
        ? optionalNumber(input.discountPercentage, "discountPercentage")
        : existing.discountPercentage === null
          ? null
          : Number(existing.discountPercentage);

    if (
      input.promoType !== undefined ||
      input.discountAmount !== undefined ||
      input.discountPercentage !== undefined ||
      input.productFinancing !== undefined
    ) {
      assertPromoFields(promoType, discountAmount, discountPercentage, productFinancing);
    }
    if (input.discountAmount !== undefined) data.discountAmount = discountAmount;
    if (input.discountPercentage !== undefined) data.discountPercentage = discountPercentage;

    const startDate =
      input.startDate !== undefined ? requireDate(input.startDate, "startDate") : existing.startDate;
    const endDate =
      input.endDate !== undefined ? requireDate(input.endDate, "endDate") : existing.endDate;
    if (endDate.getTime() < startDate.getTime()) {
      throw new Error("endDate must be on or after startDate");
    }
    if (input.startDate !== undefined) data.startDate = startDate;
    if (input.endDate !== undefined) data.endDate = endDate;

    if (Object.keys(data).length === 0) {
      throw new Error("At least one field is required");
    }

    const record = await prisma.campaign.update({
      where: { id },
      data,
      include: campaignInclude,
    });
    return mapCampaign(record);
  }

  async approveMerchantParticipation(
    id: string,
    input: {
      merchantId: string;
      approvedById: string;
      approved?: boolean;
      approvedRemarks?: string | null;
    }
  ) {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new Error("Campaign not found");

    const merchantId = requireText(input.merchantId, "merchantId");
    await assertMerchant(merchantId);
    await assertUser(input.approvedById);

    const merchantIds = asMerchantEntries(existing.merchantIds);
    const index = merchantIds.findIndex((entry) => entry.merchantId === merchantId);
    if (index < 0) {
      throw new Error("Merchant is not part of this campaign");
    }

    const approved = input.approved === undefined ? true : requireBoolean(input.approved, "approved");
    merchantIds[index] = {
      ...merchantIds[index],
      approved,
      approvedBy: input.approvedById,
      approvedAt: new Date().toISOString(),
      approvedRemarks:
        input.approvedRemarks === undefined
          ? merchantIds[index].approvedRemarks
          : optionalText(input.approvedRemarks, "approvedRemarks") ?? null,
    };

    const record = await prisma.campaign.update({
      where: { id },
      data: { merchantIds },
      include: campaignInclude,
    });
    return mapCampaign(record);
  }

  async delete(id: string) {
    const existing = await prisma.campaign.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new Error("Campaign not found");
    await prisma.campaign.delete({ where: { id } });
    return { id };
  }
}

export const campaignService = new CampaignService();
