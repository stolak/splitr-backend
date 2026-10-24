import { randomBytes } from "crypto";
import {
  CampaignChannel,
  CampaignEligibility,
  CampaignFinancingOption,
  CampaignFunding,
  CampaignInitiatedBy,
  CampaignPromoType,
  CampaignStatus,
  CampaignStatusRemarkAction,
  Prisma,
  PurchaseDiscountType,
} from "@prisma/client";
import prisma from "../utils/prisma";
import { roundUpTo2Decimals } from "../utils/helper";
import {
  assertCanChangeFunding,
  assertCanCreateWithFunding,
  assertCanPauseOrCancel,
  assertMerchantCanResumeOwn,
  assertValidCancelTransition,
  assertValidPauseTransition,
  assertValidResumeTransition,
  canActivateCampaign,
  CampaignActor,
  initialApprovedFlag,
  isAdminActor,
  isMerchantActor,
  requireRemark,
} from "./campaignRules";

const INITIATED_BY: CampaignInitiatedBy[] = Object.values(CampaignInitiatedBy);
const ELIGIBILITY: CampaignEligibility[] = Object.values(CampaignEligibility);
const PROMO_TYPES: CampaignPromoType[] = Object.values(CampaignPromoType);
const PURCHASE_DISCOUNT_TYPES: PurchaseDiscountType[] = Object.values(PurchaseDiscountType);
const FUNDING: CampaignFunding[] = Object.values(CampaignFunding);
const STATUSES: CampaignStatus[] = Object.values(CampaignStatus);
const CHANNELS: CampaignChannel[] = Object.values(CampaignChannel);
const FINANCING: CampaignFinancingOption[] = Object.values(CampaignFinancingOption);

const CHANNEL_ALIASES: Record<string, CampaignChannel> = {
  OnlineStoreWebsite: CampaignChannel.OnlineStoreWebsite,
  online_store_website: CampaignChannel.OnlineStoreWebsite,
  InStorePOS: CampaignChannel.InStorePOS,
  in_store_pos: CampaignChannel.InStorePOS,
  PaymentLinkInvoice: CampaignChannel.PaymentLinkInvoice,
  payment_link_invoice: CampaignChannel.PaymentLinkInvoice,
};

const FINANCING_ALIASES: Record<string, CampaignFinancingOption> = {
  PayIn4: CampaignFinancingOption.PayIn4,
  pay_in_4: CampaignFinancingOption.PayIn4,
  PayIn6: CampaignFinancingOption.PayIn6,
  pay_in_6: CampaignFinancingOption.PayIn6,
  MonthlyFlex: CampaignFinancingOption.MonthlyFlex,
  monthly_flex: CampaignFinancingOption.MonthlyFlex,
};

const PROMO_ALIASES: Record<string, CampaignPromoType> = {
  PurchaseDiscount: CampaignPromoType.PurchaseDiscount,
  purchase_discount: CampaignPromoType.PurchaseDiscount,
  FinanceChargeDiscount: CampaignPromoType.FinanceChargeDiscount,
  finance_charge_discount: CampaignPromoType.FinanceChargeDiscount,
  Mixed: CampaignPromoType.Mixed,
  mixed: CampaignPromoType.Mixed,
};

const PURCHASE_DISCOUNT_ALIASES: Record<string, PurchaseDiscountType> = {
  FixedAmountOff: PurchaseDiscountType.FixedAmountOff,
  fixed_amount_off: PurchaseDiscountType.FixedAmountOff,
  PercentageOff: PurchaseDiscountType.PercentageOff,
  percentage_off: PurchaseDiscountType.PercentageOff,
};

type MerchantCampaignEntry = {
  merchantId: string;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  approvedRemarks: string | null;
  /** Populated on read when the merchant exists (not persisted in JSON). */
  businessName?: string | null;
  /** Populated on read when the merchant exists (not persisted in JSON). */
  splitrId?: string | null;
};

type ProductFinanceChargeDiscountEntry = {
  product: CampaignFinancingOption;
  financeChargeDiscountPercentage: number;
};

type SplittingRatio = {
  merchant: number;
  splitr: number;
};

const campaignInclude = {
  merchant: { select: { id: true, businessName: true, businessEmail: true, splitrId: true } },
  createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
  statusRemarks: {
    orderBy: { createdAt: "desc" as const },
    include: {
      performedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  },
} as const;

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function optionalText(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) throw new Error(`${field} must be a number`);
  return n;
}

function optionalNumber(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return requireNumber(value, field);
}

function requireDate(value: unknown, field: string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error(`${field} must be a valid date`);
    return value;
  }
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${field} must be a valid date`);
  return date;
}

function parseEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  aliases?: Record<string, T>
): T {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  const raw = value.trim();
  if ((allowed as readonly string[]).includes(raw)) return raw as T;
  if (aliases?.[raw]) return aliases[raw];
  throw new Error(`${field} must be one of: ${allowed.join(", ")}`);
}

function optionalEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  aliases?: Record<string, T>
): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return parseEnum(value, field, allowed, aliases);
}

function parseStringIdArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  const ids = value.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new Error(`${field}[${index}] must be a non-empty string`);
    }
    return item.trim();
  });
  return [...new Set(ids)];
}

function parseEnumArray<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  aliases?: Record<string, T>
): T[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  const items = value.map((item, index) => parseEnum(item, `${field}[${index}]`, allowed, aliases));
  return [...new Set(items)];
}

function asMerchantEntries(value: Prisma.JsonValue | null | undefined): MerchantCampaignEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => !!item && typeof item === "object" && !Array.isArray(item))
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        merchantId: typeof row.merchantId === "string" ? row.merchantId : "",
        approved: Boolean(row.approved),
        approvedBy: typeof row.approvedBy === "string" ? row.approvedBy : null,
        approvedAt:
          typeof row.approvedAt === "string"
            ? row.approvedAt
            : row.approvedAt instanceof Date
              ? row.approvedAt.toISOString()
              : null,
        approvedRemarks: typeof row.approvedRemarks === "string" ? row.approvedRemarks : null,
      };
    })
    .filter((item) => item.merchantId.length > 0);
}

async function loadMerchantLookup(merchantIds: string[]) {
  const ids = [...new Set(merchantIds.filter(Boolean))];
  if (ids.length === 0) {
    return new Map<string, { businessName: string; splitrId: string }>();
  }
  const merchants = await prisma.merchant.findMany({
    where: { id: { in: ids } },
    select: { id: true, businessName: true, splitrId: true },
  });
  return new Map(
    merchants.map((merchant) => [
      merchant.id,
      { businessName: merchant.businessName, splitrId: merchant.splitrId },
    ])
  );
}

function withMerchantDetails(
  entries: MerchantCampaignEntry[],
  lookup: Map<string, { businessName: string; splitrId: string }>
): MerchantCampaignEntry[] {
  return entries.map((entry) => {
    const merchant = lookup.get(entry.merchantId);
    return {
      ...entry,
      businessName: merchant?.businessName ?? null,
      splitrId: merchant?.splitrId ?? null,
    };
  });
}

async function enrichMerchantEntries(
  entries: MerchantCampaignEntry[]
): Promise<MerchantCampaignEntry[]> {
  const lookup = await loadMerchantLookup(entries.map((entry) => entry.merchantId));
  return withMerchantDetails(entries, lookup);
}

function parseMerchantIds(value: unknown): MerchantCampaignEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("merchantIds must be an array");

  const entries: MerchantCampaignEntry[] = [];
  const seen = new Set<string>();

  value.forEach((item, index) => {
    if (typeof item === "string") {
      const merchantId = item.trim();
      if (!merchantId) throw new Error(`merchantIds[${index}] must be a non-empty string`);
      if (seen.has(merchantId)) return;
      seen.add(merchantId);
      entries.push({
        merchantId,
        approved: false,
        approvedBy: null,
        approvedAt: null,
        approvedRemarks: null,
      });
      return;
    }

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`merchantIds[${index}] must be a string or object`);
    }

    const row = item as Record<string, unknown>;
    const merchantId = requireText(row.merchantId, `merchantIds[${index}].merchantId`);
    if (seen.has(merchantId)) return;
    seen.add(merchantId);

    entries.push({
      merchantId,
      approved: optionalBoolean(row.approved, `merchantIds[${index}].approved`) ?? false,
      approvedBy: optionalText(row.approvedBy, `merchantIds[${index}].approvedBy`) ?? null,
      approvedAt:
        row.approvedAt === undefined || row.approvedAt === null
          ? null
          : requireDate(row.approvedAt, `merchantIds[${index}].approvedAt`).toISOString(),
      approvedRemarks: optionalText(row.approvedRemarks, `merchantIds[${index}].approvedRemarks`) ?? null,
    });
  });

  return entries;
}

function parseProductFinanceChargeDiscount(value: unknown): ProductFinanceChargeDiscountEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("productFinanceChargeDiscount must be an array");

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`productFinanceChargeDiscount[${index}] must be an object`);
    }
    const row = entry as Record<string, unknown>;
    const product = parseEnum(
      row.product,
      `productFinanceChargeDiscount[${index}].product`,
      FINANCING,
      FINANCING_ALIASES
    );
    const financeChargeDiscountPercentage = requireNumber(
      row.financeChargeDiscountPercentage,
      `productFinanceChargeDiscount[${index}].financeChargeDiscountPercentage`
    );
    if (financeChargeDiscountPercentage <= 0 || financeChargeDiscountPercentage > 100) {
      throw new Error(
        `productFinanceChargeDiscount[${index}].financeChargeDiscountPercentage must be between 0 and 100`
      );
    }
    return { product, financeChargeDiscountPercentage };
  });
}

function parseSplittingRatio(value: unknown, options?: { required?: boolean }): SplittingRatio | null {
  if (value === undefined || value === null) {
    if (options?.required) {
      throw new Error(
        "splittingRatio is required when funding is MerchantAndSplitrFunded"
      );
    }
    return null;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("splittingRatio must be an object");
  }
  const row = value as Record<string, unknown>;
  const merchant = requireNumber(row.merchant, "splittingRatio.merchant");
  const splitr = requireNumber(row.splitr, "splittingRatio.splitr");
  if (merchant < 0 || splitr < 0) {
    throw new Error("splittingRatio values must be >= 0");
  }
  const sum = Number((merchant + splitr).toFixed(6));
  if (Math.abs(sum - 1) > 0.000001) {
    throw new Error("splittingRatio.merchant + splittingRatio.splitr must equal 1");
  }
  return { merchant, splitr };
}

/**
 * MerchantFunded → { merchant: 1, splitr: 0 }
 * SplitrFunded → { merchant: 0, splitr: 1 }
 * MerchantAndSplitrFunded → required from client and validated (both sides > 0, sum = 1)
 */
function resolveSplittingRatioForFunding(
  funding: CampaignFunding,
  value: unknown
): SplittingRatio {
  if (funding === CampaignFunding.MerchantFunded) {
    return { merchant: 1, splitr: 0 };
  }
  if (funding === CampaignFunding.SplitrFunded) {
    return { merchant: 0, splitr: 1 };
  }

  const ratio = parseSplittingRatio(value, { required: true });
  if (!ratio) {
    throw new Error(
      "splittingRatio is required when funding is MerchantAndSplitrFunded"
    );
  }
  if (ratio.merchant <= 0 || ratio.splitr <= 0) {
    throw new Error(
      "splittingRatio.merchant and splittingRatio.splitr must both be greater than 0 when funding is MerchantAndSplitrFunded"
    );
  }
  return ratio;
}

function moneyOrNull(value: number | null | undefined): Prisma.Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Prisma.Decimal(roundUpTo2Decimals(value));
}

function mapMoneyFields<T extends {
  purchaseDiscountAmount: Prisma.Decimal | null;
  purchaseDiscountPercentage: Prisma.Decimal | null;
  minPurchase: Prisma.Decimal | null;
  budget: Prisma.Decimal | null;
}>(record: T) {
  return {
    ...record,
    purchaseDiscountAmount:
      record.purchaseDiscountAmount === null ? null : Number(record.purchaseDiscountAmount),
    purchaseDiscountPercentage:
      record.purchaseDiscountPercentage === null ? null : Number(record.purchaseDiscountPercentage),
    minPurchase: record.minPurchase === null ? null : Number(record.minPurchase),
    budget: record.budget === null ? null : Number(record.budget),
  };
}

type CampaignRecordForMap = {
  purchaseDiscountAmount: Prisma.Decimal | null;
  purchaseDiscountPercentage: Prisma.Decimal | null;
  minPurchase: Prisma.Decimal | null;
  budget: Prisma.Decimal | null;
  outletIds: Prisma.JsonValue;
  merchantIds: Prisma.JsonValue;
  channels: Prisma.JsonValue;
  financingProducts: Prisma.JsonValue;
  productFinanceChargeDiscount: Prisma.JsonValue;
  splittingRatio: Prisma.JsonValue | null;
};

function mapCampaignBase<T extends CampaignRecordForMap>(
  record: T,
  merchantIds: MerchantCampaignEntry[]
) {
  return {
    ...mapMoneyFields(record),
    outletIds: Array.isArray(record.outletIds) ? record.outletIds : [],
    merchantIds,
    channels: Array.isArray(record.channels) ? record.channels : [],
    financingProducts: Array.isArray(record.financingProducts) ? record.financingProducts : [],
    productFinanceChargeDiscount: Array.isArray(record.productFinanceChargeDiscount)
      ? record.productFinanceChargeDiscount
      : [],
    splittingRatio:
      record.splittingRatio &&
      typeof record.splittingRatio === "object" &&
      !Array.isArray(record.splittingRatio)
        ? record.splittingRatio
        : null,
  };
}

async function mapCampaign<T extends CampaignRecordForMap>(record: T) {
  const merchantIds = await enrichMerchantEntries(asMerchantEntries(record.merchantIds));
  return mapCampaignBase(record, merchantIds);
}

async function mapCampaigns<T extends CampaignRecordForMap>(records: T[]) {
  const entryLists = records.map((record) => asMerchantEntries(record.merchantIds));
  const lookup = await loadMerchantLookup(
    entryLists.flatMap((entries) => entries.map((entry) => entry.merchantId))
  );
  return records.map((record, index) =>
    mapCampaignBase(record, withMerchantDetails(entryLists[index], lookup))
  );
}

function assertFinancingProducts(financingProducts: CampaignFinancingOption[]) {
  if (financingProducts.length === 0) {
    throw new Error("financingProducts must include at least one product");
  }
  if (new Set(financingProducts).size !== financingProducts.length) {
    throw new Error("financingProducts must not contain duplicate products");
  }
}

function assertFinanceChargeDiscountPairing(
  financingProducts: CampaignFinancingOption[],
  productFinanceChargeDiscount: ProductFinanceChargeDiscountEntry[]
) {
  if (productFinanceChargeDiscount.length === 0) {
    throw new Error("productFinanceChargeDiscount must include at least one product");
  }

  const products = productFinanceChargeDiscount.map((entry) => entry.product);
  if (new Set(products).size !== products.length) {
    throw new Error("productFinanceChargeDiscount must not contain duplicate products");
  }

  const financingSet = new Set(financingProducts);
  const discountSet = new Set(products);

  const missing = financingProducts.filter((product) => !discountSet.has(product));
  if (missing.length > 0) {
    throw new Error(
      `productFinanceChargeDiscount is missing entries for: ${missing.join(", ")}`
    );
  }

  const extra = products.filter((product) => !financingSet.has(product));
  if (extra.length > 0) {
    throw new Error(
      `productFinanceChargeDiscount contains products not listed in financingProducts: ${extra.join(", ")}`
    );
  }
}

function assertPurchaseDiscountFields(input: {
  purchaseDiscountType?: PurchaseDiscountType | null;
  purchaseDiscountAmount?: number | null;
  purchaseDiscountPercentage?: number | null;
}) {
  if (!input.purchaseDiscountType) {
    throw new Error(
      "purchaseDiscountType is required when promoType is PurchaseDiscount or Mixed"
    );
  }
  if (input.purchaseDiscountType === PurchaseDiscountType.FixedAmountOff) {
    if (input.purchaseDiscountAmount === undefined || input.purchaseDiscountAmount === null) {
      throw new Error("purchaseDiscountAmount is required when purchaseDiscountType is FixedAmountOff");
    }
    if (input.purchaseDiscountAmount <= 0) {
      throw new Error("purchaseDiscountAmount must be greater than 0");
    }
  }
  if (input.purchaseDiscountType === PurchaseDiscountType.PercentageOff) {
    if (
      input.purchaseDiscountPercentage === undefined ||
      input.purchaseDiscountPercentage === null
    ) {
      throw new Error(
        "purchaseDiscountPercentage is required when purchaseDiscountType is PercentageOff"
      );
    }
    if (input.purchaseDiscountPercentage <= 0 || input.purchaseDiscountPercentage > 100) {
      throw new Error("purchaseDiscountPercentage must be between 0 and 100");
    }
  }
}

function assertPromoFields(input: {
  promoType: CampaignPromoType;
  purchaseDiscountType?: PurchaseDiscountType | null;
  purchaseDiscountAmount?: number | null;
  purchaseDiscountPercentage?: number | null;
  financingProducts: CampaignFinancingOption[];
  productFinanceChargeDiscount: ProductFinanceChargeDiscountEntry[];
}) {
  assertFinancingProducts(input.financingProducts);

  if (
    input.promoType === CampaignPromoType.PurchaseDiscount ||
    input.promoType === CampaignPromoType.Mixed
  ) {
    assertPurchaseDiscountFields(input);
  }

  if (input.promoType === CampaignPromoType.FinanceChargeDiscount) {
    if (input.purchaseDiscountType) {
      throw new Error("purchaseDiscountType must be null when promoType is FinanceChargeDiscount");
    }
    if (input.purchaseDiscountAmount != null) {
      throw new Error("purchaseDiscountAmount must be null when promoType is FinanceChargeDiscount");
    }
    if (input.purchaseDiscountPercentage != null) {
      throw new Error(
        "purchaseDiscountPercentage must be null when promoType is FinanceChargeDiscount"
      );
    }
  }

  if (
    input.promoType === CampaignPromoType.FinanceChargeDiscount ||
    input.promoType === CampaignPromoType.Mixed
  ) {
    assertFinanceChargeDiscountPairing(
      input.financingProducts,
      input.productFinanceChargeDiscount
    );
  } else if (input.productFinanceChargeDiscount.length > 0) {
    throw new Error(
      "productFinanceChargeDiscount must be empty when promoType is PurchaseDiscount"
    );
  }
}

async function assertMerchant(merchantId: string) {
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
    funding?: CampaignFunding;
    q?: string;
    /** When true (admin list), never scope by merchant participation. */
    adminView?: boolean;
  }) {
    const where: Prisma.CampaignWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.initiatedBy) where.initiatedBy = filters.initiatedBy;
    if (filters?.funding) where.funding = filters.funding;
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

    const mapped = await mapCampaigns(records);
    if (filters?.adminView || !filters?.merchantId) return mapped;

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
    return mapCampaigns(records);
  }

  private isRelatedToMerchant(
    campaign: { merchantId?: string | null; merchantIds?: MerchantCampaignEntry[] },
    merchantId: string
  ) {
    if (campaign.merchantId === merchantId) return true;
    return (campaign.merchantIds ?? []).some((entry) => entry.merchantId === merchantId);
  }

  async getById(id: string) {
    const record = await prisma.campaign.findUnique({
      where: { id },
      include: campaignInclude,
    });
    if (!record) throw new Error("Campaign not found");
    return await mapCampaign(record);
  }

  async getByCode(campaignCode: string) {
    const code = requireText(campaignCode, "campaignCode");
    const record = await prisma.campaign.findUnique({
      where: { campaignCode: code },
      include: campaignInclude,
    });
    if (!record) throw new Error("Campaign not found");
    return await mapCampaign(record);
  }

  async create(input: Record<string, unknown>, actor: CampaignActor) {
    await assertUser(actor.userId);

    const funding = parseEnum(input.funding, "funding", FUNDING);
    assertCanCreateWithFunding(actor, funding);

    let initiatedBy = parseEnum(input.initiatedBy, "initiatedBy", INITIATED_BY);
    if (isAdminActor(actor)) {
      initiatedBy = CampaignInitiatedBy.Splitr;
    } else if (isMerchantActor(actor)) {
      initiatedBy = CampaignInitiatedBy.Merchant;
    }

    let merchantId =
      input.merchantId === undefined || input.merchantId === null
        ? null
        : requireText(input.merchantId, "merchantId");

    if (initiatedBy === CampaignInitiatedBy.Merchant) {
      merchantId = actor.merchantId ?? merchantId;
      if (!merchantId) throw new Error("merchantId is required when initiatedBy is Merchant");
    }
    if (merchantId) await assertMerchant(merchantId);

    const merchantIds = parseMerchantIds(input.merchantIds);
    await assertMerchants(merchantIds.map((entry) => entry.merchantId));

    const outletIds = parseStringIdArray(input.outletIds, "outletIds");
    await assertOutlets(outletIds, merchantId);

    const promoType = parseEnum(input.promoType, "promoType", PROMO_TYPES, PROMO_ALIASES);
    const purchaseDiscountType = optionalEnum(
      input.purchaseDiscountType,
      "purchaseDiscountType",
      PURCHASE_DISCOUNT_TYPES,
      PURCHASE_DISCOUNT_ALIASES
    );
    const purchaseDiscountAmount = optionalNumber(
      input.purchaseDiscountAmount,
      "purchaseDiscountAmount"
    );
    const purchaseDiscountPercentage = optionalNumber(
      input.purchaseDiscountPercentage,
      "purchaseDiscountPercentage"
    );
    const financingProducts = parseEnumArray(
      input.financingProducts,
      "financingProducts",
      FINANCING,
      FINANCING_ALIASES
    );
    const productFinanceChargeDiscount = parseProductFinanceChargeDiscount(
      input.productFinanceChargeDiscount
    );

    assertPromoFields({
      promoType,
      purchaseDiscountType,
      purchaseDiscountAmount,
      purchaseDiscountPercentage,
      financingProducts,
      productFinanceChargeDiscount,
    });

    const startDate = requireDate(input.startDate, "startDate");
    const endDate = requireDate(input.endDate, "endDate");
    if (endDate.getTime() < startDate.getTime()) {
      throw new Error("endDate must be on or after startDate");
    }

    // Client cannot force Active/approved to bypass workflow
    const confirm = optionalBoolean(input.confirm, "confirm") ?? false;
    const approved = initialApprovedFlag(funding, initiatedBy);
    const campaignCode = await generateCampaignCode();
    const splittingRatio = resolveSplittingRatioForFunding(funding, input.splittingRatio);

    const created = await prisma.campaign.create({
      data: {
        merchantId,
        initiatedBy,
        name: requireText(input.name, "name"),
        description: optionalText(input.description, "description") ?? null,
        imageName: optionalText(input.imageName, "imageName") ?? null,
        outletIds,
        merchantIds,
        eligibility:
          optionalEnum(input.eligibility, "eligibility", ELIGIBILITY) ??
          CampaignEligibility.AllCustomers,
        channels: parseEnumArray(input.channels, "channels", CHANNELS, CHANNEL_ALIASES),
        productScope: optionalText(input.productScope, "productScope") ?? "All products",
        financingProducts,
        promoType,
        purchaseDiscountType: purchaseDiscountType ?? null,
        purchaseDiscountAmount: moneyOrNull(purchaseDiscountAmount) ?? null,
        purchaseDiscountPercentage:
          purchaseDiscountPercentage === undefined || purchaseDiscountPercentage === null
            ? null
            : new Prisma.Decimal(purchaseDiscountPercentage),
        minPurchase: moneyOrNull(optionalNumber(input.minPurchase, "minPurchase")) ?? null,
        allProducts: optionalBoolean(input.allProducts, "allProducts") ?? true,
        productFinanceChargeDiscount,
        splittingRatio,
        funding,
        budget: moneyOrNull(optionalNumber(input.budget, "budget")) ?? null,
        startDate,
        endDate,
        confirm,
        approved,
        status: CampaignStatus.Pending,
        campaignCode,
        createdById: actor.userId,
      },
      include: campaignInclude,
    });

    await this.tryActivateCampaign(created.id);
    return this.getById(created.id);
  }

  private activationSnapshotFromRecord(record: {
    status: CampaignStatus;
    funding: CampaignFunding;
    initiatedBy: CampaignInitiatedBy;
    approved: boolean;
    confirm: boolean;
    startDate: Date;
    endDate: Date;
    merchantIds: Prisma.JsonValue;
  }) {
    return {
      status: record.status,
      funding: record.funding,
      initiatedBy: record.initiatedBy,
      approved: record.approved,
      confirm: record.confirm,
      startDate: record.startDate,
      endDate: record.endDate,
      merchantIds: asMerchantEntries(record.merchantIds),
    };
  }

  /** Activate when Pending/Paused and all gates are met. No-op otherwise. */
  async tryActivateCampaign(id: string) {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return null;

    const check = canActivateCampaign(this.activationSnapshotFromRecord(existing));
    if (!check.ok) return existing;

    return prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.Active },
      include: campaignInclude,
    });
  }

  async update(id: string, input: Record<string, unknown>, actor: CampaignActor) {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new Error("Campaign not found");

    const data: Prisma.CampaignUpdateInput = {};

    // Status / approval must go through dedicated endpoints
    if (input.status !== undefined) {
      throw new Error(
        "status cannot be changed via update; use pause, cancel, resume, or approve endpoints"
      );
    }
    if (input.approved !== undefined || input.approvedRemarks !== undefined) {
      throw new Error(
        "approved cannot be changed via update; use the Admin/Splitr approve endpoint"
      );
    }

    if (input.initiatedBy !== undefined) {
      data.initiatedBy = parseEnum(input.initiatedBy, "initiatedBy", INITIATED_BY);
    }

    let merchantId =
      existing.merchantId === null || existing.merchantId === undefined
        ? null
        : existing.merchantId;
    if (input.merchantId !== undefined) {
      merchantId =
        input.merchantId === null ? null : requireText(input.merchantId, "merchantId");
      if (merchantId) await assertMerchant(merchantId);
      data.merchant = merchantId ? { connect: { id: merchantId } } : { disconnect: true };
    }

    const initiatedBy =
      (data.initiatedBy as CampaignInitiatedBy | undefined) ?? existing.initiatedBy;
    if (initiatedBy === CampaignInitiatedBy.Merchant && !merchantId) {
      throw new Error("merchantId is required when initiatedBy is Merchant");
    }

    if (input.name !== undefined) data.name = requireText(input.name, "name");
    if (input.description !== undefined) {
      data.description = optionalText(input.description, "description") ?? null;
    }
    if (input.imageName !== undefined) {
      data.imageName = optionalText(input.imageName, "imageName") ?? null;
    }
    if (input.productScope !== undefined) {
      data.productScope = optionalText(input.productScope, "productScope") ?? "All products";
    }
    if (input.eligibility !== undefined) {
      data.eligibility = parseEnum(input.eligibility, "eligibility", ELIGIBILITY);
    }
    const funding =
      input.funding !== undefined
        ? parseEnum(input.funding, "funding", FUNDING)
        : existing.funding;
    if (input.funding !== undefined) {
      assertCanChangeFunding(actor, funding);
      data.funding = funding;
    }
    if (input.confirm !== undefined) data.confirm = requireBoolean(input.confirm, "confirm");
    if (input.allProducts !== undefined) {
      data.allProducts = requireBoolean(input.allProducts, "allProducts");
    }
    if (input.channels !== undefined) {
      data.channels = parseEnumArray(input.channels, "channels", CHANNELS, CHANNEL_ALIASES);
    }

    const financingProducts =
      input.financingProducts !== undefined
        ? parseEnumArray(input.financingProducts, "financingProducts", FINANCING, FINANCING_ALIASES)
        : Array.isArray(existing.financingProducts)
          ? (existing.financingProducts as CampaignFinancingOption[])
          : [];
    if (input.financingProducts !== undefined) data.financingProducts = financingProducts;

    if (input.outletIds !== undefined) {
      const outletIds = parseStringIdArray(input.outletIds, "outletIds");
      await assertOutlets(outletIds, merchantId);
      data.outletIds = outletIds;
    }

    if (input.merchantIds !== undefined) {
      const merchantIds = parseMerchantIds(input.merchantIds);
      await assertMerchants(merchantIds.map((entry) => entry.merchantId));
      data.merchantIds = merchantIds;
    }

    if (input.funding !== undefined || input.splittingRatio !== undefined) {
      const ratioInput =
        input.splittingRatio !== undefined
          ? input.splittingRatio
          : existing.splittingRatio;
      data.splittingRatio = resolveSplittingRatioForFunding(funding, ratioInput);
    }

    if (input.minPurchase !== undefined) {
      data.minPurchase = moneyOrNull(optionalNumber(input.minPurchase, "minPurchase")) ?? null;
    }
    if (input.budget !== undefined) {
      data.budget = moneyOrNull(optionalNumber(input.budget, "budget")) ?? null;
    }

    const productFinanceChargeDiscount =
      input.productFinanceChargeDiscount !== undefined
        ? parseProductFinanceChargeDiscount(input.productFinanceChargeDiscount)
        : Array.isArray(existing.productFinanceChargeDiscount)
          ? (existing.productFinanceChargeDiscount as ProductFinanceChargeDiscountEntry[])
          : [];
    if (input.productFinanceChargeDiscount !== undefined) {
      data.productFinanceChargeDiscount = productFinanceChargeDiscount;
    }

    const promoType =
      input.promoType !== undefined
        ? parseEnum(input.promoType, "promoType", PROMO_TYPES, PROMO_ALIASES)
        : existing.promoType;
    if (input.promoType !== undefined) data.promoType = promoType;

    const purchaseDiscountType =
      input.purchaseDiscountType !== undefined
        ? optionalEnum(
            input.purchaseDiscountType,
            "purchaseDiscountType",
            PURCHASE_DISCOUNT_TYPES,
            PURCHASE_DISCOUNT_ALIASES
          )
        : existing.purchaseDiscountType;
    if (input.purchaseDiscountType !== undefined) {
      data.purchaseDiscountType = purchaseDiscountType ?? null;
    }

    const purchaseDiscountAmount =
      input.purchaseDiscountAmount !== undefined
        ? optionalNumber(input.purchaseDiscountAmount, "purchaseDiscountAmount")
        : existing.purchaseDiscountAmount === null
          ? null
          : Number(existing.purchaseDiscountAmount);
    const purchaseDiscountPercentage =
      input.purchaseDiscountPercentage !== undefined
        ? optionalNumber(input.purchaseDiscountPercentage, "purchaseDiscountPercentage")
        : existing.purchaseDiscountPercentage === null
          ? null
          : Number(existing.purchaseDiscountPercentage);

    if (input.purchaseDiscountAmount !== undefined) {
      data.purchaseDiscountAmount = moneyOrNull(purchaseDiscountAmount) ?? null;
    }
    if (input.purchaseDiscountPercentage !== undefined) {
      data.purchaseDiscountPercentage =
        purchaseDiscountPercentage === undefined || purchaseDiscountPercentage === null
          ? null
          : new Prisma.Decimal(purchaseDiscountPercentage);
    }

    if (
      input.promoType !== undefined ||
      input.purchaseDiscountType !== undefined ||
      input.purchaseDiscountAmount !== undefined ||
      input.purchaseDiscountPercentage !== undefined ||
      input.financingProducts !== undefined ||
      input.productFinanceChargeDiscount !== undefined
    ) {
      assertPromoFields({
        promoType,
        purchaseDiscountType,
        purchaseDiscountAmount,
        purchaseDiscountPercentage,
        financingProducts,
        productFinanceChargeDiscount,
      });
    }

    const startDate =
      input.startDate !== undefined
        ? requireDate(input.startDate, "startDate")
        : existing.startDate;
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

    await prisma.campaign.update({
      where: { id },
      data,
    });
    await this.tryActivateCampaign(id);
    return this.getById(id);
  }

  /**
   * Admin/Splitr campaign-level approval (required for merchant-created co-funded campaigns).
   */
  async approveCampaign(
    id: string,
    actor: CampaignActor,
    input: { approvedRemarks?: string | null }
  ) {
    if (!isAdminActor(actor)) {
      throw new Error("Unauthorized: Admin/Splitr approval is required");
    }

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new Error("Campaign not found");

    await prisma.campaign.update({
      where: { id },
      data: {
        approved: true,
        approvedById: actor.userId,
        approvedAt: new Date(),
        approvedRemarks: optionalText(input.approvedRemarks, "approvedRemarks") ?? null,
      },
    });

    await this.tryActivateCampaign(id);
    return this.getById(id);
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

    const approved =
      input.approved === undefined ? true : requireBoolean(input.approved, "approved");
    merchantIds[index] = {
      ...merchantIds[index],
      approved,
      approvedBy: input.approvedById,
      approvedAt: new Date().toISOString(),
      approvedRemarks:
        input.approvedRemarks === undefined
          ? merchantIds[index].approvedRemarks
          : (optionalText(input.approvedRemarks, "approvedRemarks") ?? null),
    };

    await prisma.campaign.update({
      where: { id },
      data: { merchantIds },
    });

    // Merchant acceptance alone must not activate merchant-created co-funded campaigns
    // (tryActivateCampaign enforces Admin approval gate).
    await this.tryActivateCampaign(id);
    return this.getById(id);
  }

  async pause(id: string, actor: CampaignActor, remarkRaw: unknown) {
    const remark = requireRemark(remarkRaw);
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new Error("Campaign not found");

    assertCanPauseOrCancel(actor, existing);
    assertValidPauseTransition(existing.status);

    await prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id },
        data: { status: CampaignStatus.Paused },
      });
      await tx.campaignStatusRemark.create({
        data: {
          campaignId: id,
          action: CampaignStatusRemarkAction.Paused,
          previousStatus: existing.status,
          newStatus: CampaignStatus.Paused,
          remark,
          performedById: actor.userId,
          performedByRole: actor.role || actor.userType || "Unknown",
          fundingType: existing.funding,
        },
      });
    });

    return this.getById(id);
  }

  async cancel(id: string, actor: CampaignActor, remarkRaw: unknown) {
    const remark = requireRemark(remarkRaw);
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new Error("Campaign not found");

    assertCanPauseOrCancel(actor, existing);
    assertValidCancelTransition(existing.status);

    await prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id },
        data: { status: CampaignStatus.Cancel },
      });
      await tx.campaignStatusRemark.create({
        data: {
          campaignId: id,
          action: CampaignStatusRemarkAction.Cancelled,
          previousStatus: existing.status,
          newStatus: CampaignStatus.Cancel,
          remark,
          performedById: actor.userId,
          performedByRole: actor.role || actor.userType || "Unknown",
          fundingType: existing.funding,
        },
      });
    });

    return this.getById(id);
  }

  async resume(id: string, actor: CampaignActor, remarkRaw?: unknown) {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new Error("Campaign not found");

    assertMerchantCanResumeOwn(actor, existing);
    assertValidResumeTransition(existing.status);

    const check = canActivateCampaign({
      ...this.activationSnapshotFromRecord(existing),
      status: CampaignStatus.Paused,
    });
    if (!check.ok) {
      throw new Error(check.reason || "Campaign cannot be resumed");
    }

    const remark =
      remarkRaw === undefined || remarkRaw === null
        ? "Resumed"
        : requireRemark(remarkRaw);

    await prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id },
        data: { status: CampaignStatus.Active },
      });
      await tx.campaignStatusRemark.create({
        data: {
          campaignId: id,
          action: CampaignStatusRemarkAction.Resumed,
          previousStatus: existing.status,
          newStatus: CampaignStatus.Active,
          remark,
          performedById: actor.userId,
          performedByRole: actor.role || actor.userType || "Unknown",
          fundingType: existing.funding,
        },
      });
    });

    return this.getById(id);
  }

  async listStatusRemarks(id: string) {
    const existing = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Campaign not found");

    return prisma.campaignStatusRemark.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "desc" },
      include: {
        performedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string) {
    const existing = await prisma.campaign.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new Error("Campaign not found");
    await prisma.campaign.delete({ where: { id } });
    return { id };
  }
}

export const campaignService = new CampaignService();
