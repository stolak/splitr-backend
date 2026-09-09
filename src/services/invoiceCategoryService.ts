import prisma from "../utils/prisma";

export interface InvoiceCategoryData {
  id: string;
  name: string;
  description: string | null;
  multiplier: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceCategoryInput {
  name: string;
  description?: string;
  multiplier: number;
}

export interface UpdateInvoiceCategoryInput {
  name?: string;
  description?: string | null;
  multiplier?: number;
}

const INVOICE_CATEGORIES_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type InvoiceCategoriesCacheEntry = {
  data: InvoiceCategoryData[];
  expiresAt: number;
};

let invoiceCategoriesCache: InvoiceCategoriesCacheEntry | null = null;

function setInvoiceCategoriesCache(data: InvoiceCategoryData[]): void {
  invoiceCategoriesCache = {
    data,
    expiresAt: Date.now() + INVOICE_CATEGORIES_CACHE_TTL_MS,
  };
}

function clearInvoiceCategoriesCache(): void {
  invoiceCategoriesCache = null;
}

function getCachedInvoiceCategories(): InvoiceCategoryData[] | null {
  if (invoiceCategoriesCache && Date.now() < invoiceCategoriesCache.expiresAt) {
    return invoiceCategoriesCache.data;
  }
  return null;
}

export class InvoiceCategoryService {
  private toResponse(record: any): InvoiceCategoryData {
    return {
      ...record,
      multiplier: Number(record.multiplier),
    };
  }

  /**
   * Get all invoice categories.
   * Served from an in-memory cache for 30 minutes; the cache is cleared on write.
   */
  async getInvoiceCategories(): Promise<InvoiceCategoryData[]> {
    const cached = getCachedInvoiceCategories();
    if (cached) {
      return cached;
    }

    const records = await prisma.invoiceCategory.findMany({
      orderBy: { name: "asc" },
    });

    const data = records.map((record) => this.toResponse(record));
    setInvoiceCategoriesCache(data);
    return data;
  }

  /**
   * Get a single invoice category by id, resolved from the cached list.
   */
  async getInvoiceCategoryById(id: string): Promise<InvoiceCategoryData | null> {
    const categories = await this.getInvoiceCategories();
    return categories.find((category) => category.id === id) ?? null;
  }

  /**
   * Get a single invoice category by unique name, resolved from the cached list.
   */
  async getInvoiceCategoryByName(name: string): Promise<InvoiceCategoryData | null> {
    const categories = await this.getInvoiceCategories();
    return (
      categories.find(
        (category) => category.name.toLowerCase() === name.trim().toLowerCase()
      ) ?? null
    );
  }

  async createInvoiceCategory(
    input: CreateInvoiceCategoryInput
  ): Promise<InvoiceCategoryData> {
    const name = input.name?.trim();
    if (!name) {
      throw new Error("name is required");
    }

    if (!Number.isFinite(input.multiplier)) {
      throw new Error("multiplier is required and must be a number");
    }

    const existing = await prisma.invoiceCategory.findUnique({
      where: { name },
    });
    if (existing) {
      throw new Error("Another invoice category exists with provided name");
    }

    const record = await prisma.invoiceCategory.create({
      data: {
        name,
        description: input.description?.trim() || null,
        multiplier: input.multiplier,
      },
    });

    clearInvoiceCategoriesCache();
    return this.toResponse(record);
  }

  async updateInvoiceCategory(
    id: string,
    input: UpdateInvoiceCategoryInput
  ): Promise<InvoiceCategoryData> {
    const existing = await prisma.invoiceCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Invoice category not found");
    }

    const updateData: {
      name?: string;
      description?: string | null;
      multiplier?: number;
    } = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) {
        throw new Error("name cannot be empty");
      }

      const byName = await prisma.invoiceCategory.findFirst({
        where: {
          name,
          id: { not: id },
        },
      });
      if (byName) {
        throw new Error("Another invoice category exists with provided name");
      }

      updateData.name = name;
    }

    if (input.description !== undefined) {
      updateData.description =
        input.description === null ? null : String(input.description).trim() || null;
    }

    if (input.multiplier !== undefined) {
      if (!Number.isFinite(input.multiplier)) {
        throw new Error("multiplier must be a number");
      }
      updateData.multiplier = input.multiplier;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("At least one of name, description, or multiplier is required");
    }

    const record = await prisma.invoiceCategory.update({
      where: { id },
      data: updateData,
    });

    clearInvoiceCategoriesCache();
    return this.toResponse(record);
  }

  async deleteInvoiceCategory(id: string): Promise<{ id: string }> {
    const existing = await prisma.invoiceCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Invoice category not found");
    }

    await prisma.invoiceCategory.delete({
      where: { id },
    });

    clearInvoiceCategoriesCache();
    return { id };
  }
}

export const invoiceCategoryService = new InvoiceCategoryService();
