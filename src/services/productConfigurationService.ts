import { ProductType } from "@prisma/client";
import prisma from "../utils/prisma";

export const PRODUCT_TYPE_VALUES: ProductType[] = ["BI_WEEKLY", "MONTHLY_FLEX"];

export interface ProductConfigurationData {
  id: string;
  productType: ProductType;
  code: string;
  productName: string;
  tenure: number;
  minimumFinance: number;
  maximumFinance: number;
  rate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductConfigurationInput {
  productType?: ProductType;
  code?: string;
  productName?: string;
  tenure?: number;
  minimumFinance?: number;
  maximumFinance?: number;
  rate?: number;
}

const PRODUCT_CONFIGURATIONS_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type ProductConfigurationsCacheEntry = {
  data: ProductConfigurationData[];
  expiresAt: number;
};

let productConfigurationsCache: ProductConfigurationsCacheEntry | null = null;

function setProductConfigurationsCache(data: ProductConfigurationData[]): void {
  productConfigurationsCache = {
    data,
    expiresAt: Date.now() + PRODUCT_CONFIGURATIONS_CACHE_TTL_MS,
  };
}

function clearProductConfigurationsCache(): void {
  productConfigurationsCache = null;
}

function getCachedProductConfigurations(): ProductConfigurationData[] | null {
  if (productConfigurationsCache && Date.now() < productConfigurationsCache.expiresAt) {
    return productConfigurationsCache.data;
  }
  return null;
}

export class ProductConfigurationService {
  /**
   * Helper function to convert Prisma Decimal fields to numbers
   */
  private convertDecimalToNumber(productConfiguration: any): ProductConfigurationData {
    return {
      ...productConfiguration,
      tenure: Number(productConfiguration.tenure),
      minimumFinance: Number(productConfiguration.minimumFinance),
      maximumFinance: Number(productConfiguration.maximumFinance),
      rate: Number(productConfiguration.rate),
    };
  }

  /**
   * Get all product configurations.
   * Served from an in-memory cache for 30 minutes; the cache is refreshed on write.
   */
  async getProductConfigurations(): Promise<ProductConfigurationData[]> {
    try {
      const cached = getCachedProductConfigurations();
      if (cached) {
        return cached;
      }

      const productConfigurations = await prisma.productConfiguration.findMany({
        orderBy: [{ productType: "asc" }, { tenure: "asc" }],
      });

      const data = productConfigurations.map((productConfiguration) =>
        this.convertDecimalToNumber(productConfiguration)
      );
      setProductConfigurationsCache(data);
      return data;
    } catch (error) {
      console.error("Error fetching product configurations:", error);
      throw new Error("Failed to fetch product configurations");
    }
  }

  /**
   * Get a single product configuration by id, resolved from the cached list
   */
  async getProductConfigurationById(id: string): Promise<ProductConfigurationData | null> {
    try {
      const productConfigurations = await this.getProductConfigurations();
      return (
        productConfigurations.find((productConfiguration) => productConfiguration.id === id) ?? null
      );
    } catch (error) {
      console.error("Error fetching product configuration:", error);
      throw new Error("Failed to fetch product configuration");
    }
  }

  /**
   * Get a single product configuration by code, resolved from the cached list
   */
  async getProductConfigurationByCode(code: string): Promise<ProductConfigurationData | null> {
    try {
      const productConfigurations = await this.getProductConfigurations();
      return (
        productConfigurations.find(
          (productConfiguration) => productConfiguration.code === code
        ) ?? null
      );
    } catch (error) {
      console.error("Error fetching product configuration:", error);
      throw new Error("Failed to fetch product configuration");
    }
  }

  /**
   * Get every product configuration for a product type, resolved from the cached list
   */
  async getProductConfigurationsByType(
    productType: ProductType
  ): Promise<ProductConfigurationData[]> {
    try {
      const productConfigurations = await this.getProductConfigurations();
      return productConfigurations.filter(
        (productConfiguration) => productConfiguration.productType === productType
      );
    } catch (error) {
      console.error("Error fetching product configurations:", error);
      throw new Error("Failed to fetch product configurations");
    }
  }

  /**
   * Get the product configuration for a product type and tenure, resolved from the
   * cached list. This is the canonical way to look up the terms that apply to a
   * financing request.
   */
  async getProductConfigurationByTypeAndTenure(
    productType: ProductType,
    tenure: number
  ): Promise<ProductConfigurationData | null> {
    try {
      const productConfigurations = await this.getProductConfigurations();
      return (
        productConfigurations.find(
          (productConfiguration) =>
            productConfiguration.productType === productType &&
            productConfiguration.tenure === tenure
        ) ?? null
      );
    } catch (error) {
      console.error("Error fetching product configuration:", error);
      throw new Error("Failed to fetch product configuration");
    }
  }

  /**
   * Update specific product configuration fields
   */
  async updateProductConfiguration(
    id: string,
    data: ProductConfigurationInput
  ): Promise<ProductConfigurationData> {
    try {
      const existing = await prisma.productConfiguration.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Product configuration not found");
      }

      // Prepare update data with only provided fields
      const updateData: any = {};

      if (data.productType !== undefined) {
        if (!PRODUCT_TYPE_VALUES.includes(data.productType)) {
          throw new Error(
            `productType must be one of ${PRODUCT_TYPE_VALUES.join(", ")}`
          );
        }
        updateData.productType = data.productType;
      }
      if (data.code !== undefined) {
        updateData.code = data.code;
      }
      if (data.productName !== undefined) {
        updateData.productName = data.productName;
      }
      if (data.tenure !== undefined) {
        updateData.tenure = data.tenure;
      }
      if (data.minimumFinance !== undefined) {
        updateData.minimumFinance = data.minimumFinance;
      }
      if (data.maximumFinance !== undefined) {
        updateData.maximumFinance = data.maximumFinance;
      }
      if (data.rate !== undefined) {
        updateData.rate = data.rate;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("No valid fields provided for update");
      }

      const minimumFinance = updateData.minimumFinance ?? Number(existing.minimumFinance);
      const maximumFinance = updateData.maximumFinance ?? Number(existing.maximumFinance);

      if (minimumFinance > maximumFinance) {
        throw new Error("minimumFinance cannot be greater than maximumFinance");
      }

      if (data.code !== undefined && data.code !== existing.code) {
        const duplicate = await prisma.productConfiguration.findUnique({
          where: { code: data.code },
        });

        if (duplicate) {
          throw new Error(`Product configuration with code ${data.code} already exists`);
        }
      }

      // Financing requests are resolved by product type and tenure, so that pair has to
      // stay unique even though the database only enforces uniqueness on `code`
      const productType = updateData.productType ?? existing.productType;
      const tenure = updateData.tenure ?? existing.tenure;

      if (productType !== existing.productType || tenure !== existing.tenure) {
        const conflicting = await prisma.productConfiguration.findFirst({
          where: { productType, tenure, id: { not: id } },
        });

        if (conflicting) {
          throw new Error(
            `Product configuration ${conflicting.code} already covers ${productType} ` +
              `with a tenure of ${tenure}`
          );
        }
      }

      const productConfiguration = await prisma.productConfiguration.update({
        where: { id },
        data: updateData,
      });

      // The cached list is now stale, so drop it and let the next read repopulate it
      clearProductConfigurationsCache();

      return this.convertDecimalToNumber(productConfiguration);
    } catch (error: any) {
      console.error("Error updating product configuration:", error);
      throw new Error(error?.message || "Failed to update product configuration");
    }
  }
}

export const productConfigurationService = new ProductConfigurationService();
