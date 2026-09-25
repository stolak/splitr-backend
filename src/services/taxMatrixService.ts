import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function requireProvinceCode(value: unknown): string {
  const code = requireText(value, "provinceCode").toUpperCase();
  return code;
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

function mapTaxMatrix<T extends { gstRate: Prisma.Decimal; psrRate: Prisma.Decimal }>(record: T) {
  return {
    ...record,
    gstRate: Number(record.gstRate),
    psrRate: Number(record.psrRate),
  };
}

async function write<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("A tax matrix already exists for this province code");
    }
    throw error;
  }
}

export class TaxMatrixService {
  async list() {
    const records = await prisma.taxMatrix.findMany({
      orderBy: { provinceCode: "asc" },
    });
    return records.map((record) => mapTaxMatrix(record));
  }

  async getById(id: string) {
    const record = await prisma.taxMatrix.findUnique({ where: { id } });
    return record ? mapTaxMatrix(record) : null;
  }

  async getByProvinceCode(provinceCode: string) {
    const record = await prisma.taxMatrix.findUnique({
      where: { provinceCode: provinceCode.trim().toUpperCase() },
    });
    return record ? mapTaxMatrix(record) : null;
  }

  async create(input: {
    provinceCode?: unknown;
    province?: unknown;
    gstRate?: unknown;
    psrRate?: unknown;
  }) {
    const provinceCode = requireProvinceCode(input.provinceCode);
    const province = requireText(input.province, "province");
    const gstRate = requireNumber(input.gstRate, "gstRate");
    const psrRate = requireNumber(input.psrRate, "psrRate");

    const duplicate = await prisma.taxMatrix.findUnique({
      where: { provinceCode },
      select: { id: true },
    });
    if (duplicate) {
      throw new Error("A tax matrix already exists for this province code");
    }

    const record = await write(() =>
      prisma.taxMatrix.create({
        data: { provinceCode, province, gstRate, psrRate },
      })
    );
    return mapTaxMatrix(record);
  }

  async update(
    id: string,
    input: {
      provinceCode?: unknown;
      province?: unknown;
      gstRate?: unknown;
      psrRate?: unknown;
    }
  ) {
    const existing = await prisma.taxMatrix.findUnique({ where: { id } });
    if (!existing) throw new Error("Tax matrix not found");

    const provinceCode =
      input.provinceCode === undefined ? undefined : requireProvinceCode(input.provinceCode);
    const province = input.province === undefined ? undefined : requireText(input.province, "province");
    const gstRate = optionalNumber(input.gstRate, "gstRate");
    const psrRate = optionalNumber(input.psrRate, "psrRate");

    if (
      provinceCode === undefined &&
      province === undefined &&
      gstRate === undefined &&
      psrRate === undefined
    ) {
      throw new Error("At least one field is required");
    }

    if (provinceCode && provinceCode !== existing.provinceCode) {
      const duplicate = await prisma.taxMatrix.findUnique({
        where: { provinceCode },
        select: { id: true },
      });
      if (duplicate) {
        throw new Error("A tax matrix already exists for this province code");
      }
    }

    const record = await write(() =>
      prisma.taxMatrix.update({
        where: { id },
        data: {
          ...(provinceCode !== undefined && { provinceCode }),
          ...(province !== undefined && { province }),
          ...(gstRate !== undefined && { gstRate }),
          ...(psrRate !== undefined && { psrRate }),
        },
      })
    );
    return mapTaxMatrix(record);
  }

  async delete(id: string) {
    const existing = await prisma.taxMatrix.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Tax matrix not found");
    await prisma.taxMatrix.delete({ where: { id } });
    return { id };
  }
}

export const taxMatrixService = new TaxMatrixService();
