import { OutletStatus, OutletType, Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

const OUTLET_TYPES = Object.values(OutletType);
const OUTLET_STATUSES = Object.values(OutletStatus);

const outletInclude = {
  merchant: { select: { id: true, businessName: true } },
  userManager: { select: { id: true, firstName: true, lastName: true, email: true } },
  province: {
    select: {
      provinceCode: true,
      province: true,
      gstRate: true,
      psrRate: true,
      timeZone: true,
    },
  },
  outletMerchantBankAccount: {
    select: {
      id: true,
      bankAccountId: true,
      bankName: true,
      last4: true,
      accountHolderName: true,
      routingNumber: true,
      accountType: true,
      merchantId: true,
      accountName: true,
    },
  },
} satisfies Prisma.OutletInclude;

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

function optionalEnum<T extends string>(value: unknown, field: string, allowed: readonly T[]): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${field} must be ${allowed.join(", ")}`);
  }
  return value as T;
}

async function assertMerchant(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId }, select: { id: true } });
  if (!merchant) throw new Error("Merchant not found");
}

async function assertUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new Error("User not found");
}

async function resolveProvinceCode(provinceCode: unknown): Promise<string | null | undefined> {
  if (provinceCode === undefined) return undefined;
  if (provinceCode === null) return null;
  if (typeof provinceCode !== "string") throw new Error("provinceCode must be a string");
  const code = provinceCode.trim().toUpperCase();
  if (!code) return null;
  const tax = await prisma.taxMatrix.findUnique({
    where: { provinceCode: code },
    select: { provinceCode: true },
  });
  if (!tax) throw new Error("Province code not found");
  return tax.provinceCode;
}

async function resolveMerchantBankAccount(value: unknown, merchantId: string) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new Error("outletMerchantBankAccountId must be a string");
  const id = value.trim();
  if (!id) return null;
  const account = await prisma.merchantBankAccount.findUnique({
    where: { id },
    select: { id: true, merchantId: true },
  });
  if (!account) throw new Error("Merchant bank account not found");
  if (account.merchantId !== merchantId) {
    throw new Error("Merchant bank account belongs to another merchant");
  }
  return account;
}

export class OutletService {
  async list(merchantId?: string) {
    return prisma.outlet.findMany({
      where: merchantId ? { merchantId } : undefined,
      include: outletInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return prisma.outlet.findUnique({ where: { id }, include: outletInclude });
  }

  async createDefaultForMerchant(input: {
    merchantId: string;
    outletName: string;
    outletAddress?: string | null;
    outletPhone?: string | null;
    outletEmail?: string | null;
    userManagerId?: string | null;
    provinceCode?: string | null;
  }) {
    const provinceCode = await resolveProvinceCode(input.provinceCode);
    return prisma.outlet.create({
      data: {
        merchantId: input.merchantId,
        outletName: input.outletName,
        outletAddress: input.outletAddress || null,
        outletPhone: input.outletPhone || null,
        outletEmail: input.outletEmail || null,
        userManagerId: input.userManagerId || null,
        ...(provinceCode ? { provinceCode } : {}),
        status: OutletStatus.Active,
        type: OutletType.HeadOffice,
      },
      include: outletInclude,
    });
  }

  async create(input: Record<string, unknown>) {
    const merchantId = requireText(input.merchantId, "merchantId");
    const outletName = requireText(input.outletName, "outletName");
    await assertMerchant(merchantId);

    const userManagerId = optionalText(input.userManagerId, "userManagerId");
    if (userManagerId) await assertUser(userManagerId);

    const code = optionalText(input.code, "code");
    if (typeof code === "string" && code.length > 30) {
      throw new Error("code must be at most 30 characters");
    }
    const provinceCode = await resolveProvinceCode(input.provinceCode);
    const bankAccount = await resolveMerchantBankAccount(input.outletMerchantBankAccountId, merchantId);

    try {
      return await prisma.outlet.create({
        data: {
          merchantId,
          outletName,
          code,
          ...(provinceCode ? { provinceCode } : {}),
          ...(bankAccount ? { outletMerchantBankAccountId: bankAccount.id } : {}),
          outletAddress: optionalText(input.outletAddress, "outletAddress"),
          outletPhone: optionalText(input.outletPhone, "outletPhone"),
          outletEmail: optionalText(input.outletEmail, "outletEmail"),
          userManagerId,
          status: optionalEnum(input.status, "status", OUTLET_STATUSES) ?? OutletStatus.Active,
          type: optionalEnum(input.type, "type", OUTLET_TYPES) ?? OutletType.HeadOffice,
        },
        include: outletInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("Outlet code already exists");
      }
      throw error;
    }
  }

  async update(id: string, input: Record<string, unknown>) {
    const existing = await prisma.outlet.findUnique({
      where: { id },
      select: { id: true, merchantId: true, provinceCode: true, outletMerchantBankAccountId: true },
    });
    if (!existing) throw new Error("Outlet not found");

    const data: Prisma.OutletUpdateInput = {};
    if (input.outletName !== undefined) data.outletName = requireText(input.outletName, "outletName");
    if (input.outletAddress !== undefined) {
      data.outletAddress = optionalText(input.outletAddress, "outletAddress");
    }
    if (input.outletPhone !== undefined) data.outletPhone = optionalText(input.outletPhone, "outletPhone");
    if (input.outletEmail !== undefined) data.outletEmail = optionalText(input.outletEmail, "outletEmail");
    if (input.provinceCode !== undefined) {
      const provinceCode = await resolveProvinceCode(input.provinceCode);
      if (provinceCode) {
        data.province = { connect: { provinceCode } };
      } else if (existing.provinceCode) {
        data.province = { disconnect: true };
      }
    }
    if (input.code !== undefined) {
      const code = optionalText(input.code, "code");
      if (typeof code === "string" && code.length > 30) {
        throw new Error("code must be at most 30 characters");
      }
      data.code = code;
    }
    if (input.status !== undefined) {
      const status = optionalEnum(input.status, "status", OUTLET_STATUSES);
      if (!status) throw new Error("status is required");
      data.status = status;
    }
    if (input.type !== undefined) {
      const type = optionalEnum(input.type, "type", OUTLET_TYPES);
      if (!type) throw new Error("type is required");
      data.type = type;
    }
    const merchantId =
      input.merchantId !== undefined ? requireText(input.merchantId, "merchantId") : existing.merchantId;
    if (input.merchantId !== undefined) {
      await assertMerchant(merchantId);
      data.merchant = { connect: { id: merchantId } };
    }
    if (input.outletMerchantBankAccountId !== undefined) {
      const bankAccount = await resolveMerchantBankAccount(input.outletMerchantBankAccountId, merchantId);
      if (bankAccount) {
        data.outletMerchantBankAccount = { connect: { id: bankAccount.id } };
      } else if (existing.outletMerchantBankAccountId) {
        data.outletMerchantBankAccount = { disconnect: true };
      }
    } else if (input.merchantId !== undefined && existing.outletMerchantBankAccountId) {
      await resolveMerchantBankAccount(existing.outletMerchantBankAccountId, merchantId);
    }
    if (input.userManagerId !== undefined) {
      const userManagerId = optionalText(input.userManagerId, "userManagerId");
      data.userManager = userManagerId ? { connect: { id: userManagerId } } : { disconnect: true };
      if (userManagerId) await assertUser(userManagerId);
    }

    if (Object.keys(data).length === 0) {
      throw new Error("At least one field is required");
    }

    try {
      return await prisma.outlet.update({ where: { id }, data, include: outletInclude });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("Outlet code already exists");
      }
      throw error;
    }
  }

  async delete(id: string) {
    const existing = await prisma.outlet.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new Error("Outlet not found");
    await prisma.outlet.delete({ where: { id } });
    return { id };
  }
}

export const outletService = new OutletService();
