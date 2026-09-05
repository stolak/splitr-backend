import { Request, Response } from 'express';
import {
  productConfigurationService,
  ProductConfigurationInput,
} from '../services/productConfigurationService';

export class ProductConfigurationController {
  /**
   * Get all product configurations
   */
  async getProductConfigurations(req: Request, res: Response) {
    try {
      const productConfigurations =
        await productConfigurationService.getProductConfigurations();

      res.status(200).json({
        success: true,
        data: productConfigurations,
      });
    } catch (error: any) {
      console.error('Error getting product configurations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Get a single product configuration by id
   */
  async getProductConfigurationById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const productConfiguration =
        await productConfigurationService.getProductConfigurationById(id);

      if (!productConfiguration) {
        return res.status(404).json({
          success: false,
          message: 'Product configuration not found',
        });
      }

      res.status(200).json({
        success: true,
        data: productConfiguration,
      });
    } catch (error: any) {
      console.error('Error getting product configuration:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Get a single product configuration by code
   */
  async getProductConfigurationByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;

      const productConfiguration =
        await productConfigurationService.getProductConfigurationByCode(code);

      if (!productConfiguration) {
        return res.status(404).json({
          success: false,
          message: 'Product configuration not found',
        });
      }

      res.status(200).json({
        success: true,
        data: productConfiguration,
      });
    } catch (error: any) {
      console.error('Error getting product configuration:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Update specific product configuration fields
   */
  async updateProductConfiguration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: ProductConfigurationInput = req.body ?? {};

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields provided for update',
        });
      }

      if (data.code !== undefined && (typeof data.code !== 'string' || !data.code.trim())) {
        return res.status(400).json({
          success: false,
          message: 'code must be a non-empty string',
        });
      }

      if (
        data.productName !== undefined &&
        (typeof data.productName !== 'string' || !data.productName.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: 'productName must be a non-empty string',
        });
      }

      if (
        data.tenure !== undefined &&
        (typeof data.tenure !== 'number' || !Number.isInteger(data.tenure) || data.tenure <= 0)
      ) {
        return res.status(400).json({
          success: false,
          message: 'tenure must be an integer greater than zero',
        });
      }

      const numericFields: Array<[string, any]> = [
        ['minimumFinance', data.minimumFinance],
        ['maximumFinance', data.maximumFinance],
        ['rate', data.rate],
      ];

      for (const [field, value] of numericFields) {
        if (value === undefined) continue;

        if (typeof value !== 'number' || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a number`,
          });
        }

        if (value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative`,
          });
        }
      }

      const productConfiguration =
        await productConfigurationService.updateProductConfiguration(id, data);

      res.status(200).json({
        success: true,
        message: 'Product configuration updated successfully',
        data: productConfiguration,
      });
    } catch (error: any) {
      console.error('Error updating product configuration:', error);
      const message = error.message || 'Internal server error';
      const status =
        message.includes('not found')
          ? 404
          : message.includes('already exists') ||
            message.includes('cannot be greater than') ||
            message.includes('No valid fields')
          ? 400
          : 500;

      res.status(status).json({
        success: false,
        message,
      });
    }
  }
}

export const productConfigurationController = new ProductConfigurationController();
