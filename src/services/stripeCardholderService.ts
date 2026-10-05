import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function requireCardholderId(value: unknown): string {
  const cardholderId = requireText(value, "cardholderId");
  if (cardholderId.length > 100) {
    throw new Error("cardholderId must be at most 100 characters");
  }
  return cardholderId;
}

function optionalCardholderId(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return requireCardholderId(value);
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  throw new Error(`${field} must be a boolean`);
}

async function assertBuyer(buyerId: string) {
  const buyer = await prisma.buyer.findUnique({
    where: { id: buyerId },
    select: { id: true },
  });
  if (!buyer) throw new Error("Buyer not found");
}

async function write<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(" ") : "";
      if (String(target).includes("cardholderId")) {
        throw new Error("A Stripe cardholder already exists for this cardholder id");
      }
      throw new Error("A Stripe cardholder already exists for this buyer");
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new Error("Buyer not found");
    }
    throw error;
  }
}

export class StripeCardholderService {
  async list(filters?: { buyerId?: string; isFake?: boolean }) {
    return prisma.stripeCardholder.findMany({
      where: {
        ...(filters?.buyerId ? { buyerId: filters.buyerId } : {}),
        ...(filters?.isFake !== undefined ? { isFake: filters.isFake } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return prisma.stripeCardholder.findUnique({ where: { id } });
  }

  async getByBuyerId(buyerId: string) {
    return prisma.stripeCardholder.findUnique({ where: { buyerId } });
  }

  async create(input: { buyerId?: unknown; cardholderId?: unknown; isFake?: unknown }) {
    const buyerId = requireText(input.buyerId, "buyerId");
    const cardholderId = requireCardholderId(input.cardholderId);
    const isFake = optionalBoolean(input.isFake, "isFake");
    await assertBuyer(buyerId);

    return write(() =>
      prisma.stripeCardholder.create({
        data: {
          buyerId,
          cardholderId,
          ...(isFake !== undefined && { isFake }),
        },
      })
    );
  }

  async upsert(input: { buyerId?: unknown; cardholderId?: unknown; isFake?: unknown }) {
    const buyerId = requireText(input.buyerId, "buyerId");
    const cardholderId = requireCardholderId(input.cardholderId);
    const isFake = optionalBoolean(input.isFake, "isFake");
    await assertBuyer(buyerId);

    const taken = await prisma.stripeCardholder.findUnique({
      where: { cardholderId },
      select: { buyerId: true },
    });
    if (taken && taken.buyerId !== buyerId) {
      throw new Error("A Stripe cardholder already exists for this cardholder id");
    }

    return write(() =>
      prisma.stripeCardholder.upsert({
        where: { buyerId },
        create: {
          buyerId,
          cardholderId,
          ...(isFake !== undefined && { isFake }),
        },
        update: {
          cardholderId,
          ...(isFake !== undefined && { isFake }),
        },
      })
    );
  }

  async update(id: string, input: { buyerId?: unknown; cardholderId?: unknown; isFake?: unknown }) {
    const existing = await prisma.stripeCardholder.findUnique({ where: { id } });
    if (!existing) throw new Error("Stripe cardholder not found");

    const buyerId = input.buyerId === undefined ? undefined : requireText(input.buyerId, "buyerId");
    const cardholderId = optionalCardholderId(input.cardholderId);
    const isFake = optionalBoolean(input.isFake, "isFake");

    if (buyerId === undefined && cardholderId === undefined && isFake === undefined) {
      throw new Error("At least one field is required");
    }

    if (buyerId) await assertBuyer(buyerId);

    return write(() =>
      prisma.stripeCardholder.update({
        where: { id },
        data: {
          ...(buyerId !== undefined && { buyerId }),
          ...(cardholderId !== undefined && { cardholderId }),
          ...(isFake !== undefined && { isFake }),
        },
      })
    );
  }

  async delete(id: string) {
    const existing = await prisma.stripeCardholder.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Stripe cardholder not found");
    await prisma.stripeCardholder.delete({ where: { id } });
    return { id };
  }
}

export const stripeCardholderService = new StripeCardholderService();
