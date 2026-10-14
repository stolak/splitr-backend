import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

const accountInclude = {
  merchant: { select: { id: true, businessName: true } },
} satisfies Prisma.MerchantBankAccountInclude;

export type ExternalBankAccountInput = {
  id: string;
  bank_name?: string | null;
  last4?: string | null;
  account_holder_name?: string | null;
  routing_number?: string | null;
  account_type?: string | null;
};

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function optionalText(value: unknown, field: string, max?: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (max && trimmed.length > max) {
    throw new Error(`${field} must be at most ${max} characters`);
  }
  return trimmed;
}

function clip(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

async function assertMerchant(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId }, select: { id: true } });
  if (!merchant) throw new Error("Merchant not found");
}

export class MerchantBankAccountService {
  async list(merchantId?: string) {
    return prisma.merchantBankAccount.findMany({
      where: merchantId ? { merchantId } : undefined,
      include: accountInclude,
      orderBy: { bankName: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.merchantBankAccount.findUnique({ where: { id }, include: accountInclude });
  }

  async create(input: Record<string, unknown>) {
    const merchantId = requireText(input.merchantId, "merchantId");
    const bankAccountId = requireText(input.bankAccountId, "bankAccountId");
    const bankName = requireText(input.bankName, "bankName");
    if (bankName.length > 100) throw new Error("bankName must be at most 100 characters");
    await assertMerchant(merchantId);

    try {
      return await prisma.merchantBankAccount.create({
        data: {
          merchantId,
          bankAccountId,
          bankName,
          last4: optionalText(input.last4, "last4", 4) ?? "****",
          accountHolderName: optionalText(input.accountHolderName, "accountHolderName", 100),
          routingNumber: optionalText(input.routingNumber, "routingNumber", 100),
          accountType: optionalText(input.accountType, "accountType", 100),
          accountName: optionalText(input.accountName, "accountName"),
        },
        include: accountInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("Bank account already exists");
      }
      throw error;
    }
  }

  async update(id: string, input: Record<string, unknown>) {
    const existing = await prisma.merchantBankAccount.findUnique({ where: { id } });
    if (!existing) throw new Error("Merchant bank account not found");

    const data: Prisma.MerchantBankAccountUpdateInput = {};
    if (input.bankName !== undefined) {
      const bankName = requireText(input.bankName, "bankName");
      if (bankName.length > 100) throw new Error("bankName must be at most 100 characters");
      data.bankName = bankName;
    }
    if (input.bankAccountId !== undefined) data.bankAccountId = requireText(input.bankAccountId, "bankAccountId");
    if (input.last4 !== undefined) data.last4 = optionalText(input.last4, "last4", 4);
    if (input.accountHolderName !== undefined) {
      data.accountHolderName = optionalText(input.accountHolderName, "accountHolderName", 100);
    }
    if (input.routingNumber !== undefined) {
      data.routingNumber = optionalText(input.routingNumber, "routingNumber", 100);
    }
    if (input.accountType !== undefined) data.accountType = optionalText(input.accountType, "accountType", 100);
    if (input.accountName !== undefined) data.accountName = optionalText(input.accountName, "accountName");
    if (input.merchantId !== undefined) {
      const merchantId = requireText(input.merchantId, "merchantId");
      await assertMerchant(merchantId);
      data.merchant = { connect: { id: merchantId } };
    }

    if (Object.keys(data).length === 0) {
      throw new Error("At least one field is required");
    }

    try {
      return await prisma.merchantBankAccount.update({ where: { id }, data, include: accountInclude });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("Bank account already exists");
      }
      throw error;
    }
  }

  async delete(id: string) {
    const existing = await prisma.merchantBankAccount.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new Error("Merchant bank account not found");
    await prisma.merchantBankAccount.delete({ where: { id } });
    return { id };
  }

  async syncFromStripe(
    merchantId: string,
    accounts: ExternalBankAccountInput[],
    accountNameFallback?: string | null
  ) {
    await assertMerchant(merchantId);
    const syncedIds: string[] = [];
    const records = [];

    for (const account of accounts) {
      if (!account.id) continue;
      const existing = await prisma.merchantBankAccount.findUnique({
        where: { bankAccountId: account.id },
        select: { id: true, merchantId: true },
      });
      if (existing && existing.merchantId !== merchantId) {
        throw new Error("Bank account already belongs to another merchant");
      }

      const bankName = clip(account.bank_name, 100) || "Unknown bank";
      const data = {
        bankName,
        last4: clip(account.last4, 4) || "****",
        accountHolderName: clip(account.account_holder_name, 100),
        routingNumber: clip(account.routing_number, 100),
        accountType: clip(account.account_type, 100),
        accountName: clip(account.account_holder_name, 191) || clip(accountNameFallback, 191) || bankName,
        merchantId,
      };

      const record = await prisma.merchantBankAccount.upsert({
        where: { bankAccountId: account.id },
        create: { bankAccountId: account.id, ...data },
        update: data,
        include: accountInclude,
      });
      syncedIds.push(account.id);
      records.push(record);
    }

    if (syncedIds.length > 0) {
      await prisma.merchantBankAccount.deleteMany({
        where: { merchantId, bankAccountId: { notIn: syncedIds } },
      });
    }

    return records;
  }
}

export const merchantBankAccountService = new MerchantBankAccountService();
