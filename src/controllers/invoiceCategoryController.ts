import { Request, Response } from "express";
import { invoiceCategoryService } from "../services/invoiceCategoryService";

function statusFromError(message: string): number {
  if (message.includes("not found") || message.includes("Not found")) {
    return 404;
  }
  if (
    message.includes("required") ||
    message.includes("must be") ||
    message.includes("cannot be") ||
    message.includes("already exists") ||
    message.includes("Another invoice category") ||
    message.includes("At least one")
  ) {
    return 400;
  }
  return 500;
}

export class InvoiceCategoryController {
  async list(req: Request, res: Response) {
    try {
      const categories = await invoiceCategoryService.getInvoiceCategories();
      return res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const category = await invoiceCategoryService.getInvoiceCategoryById(
        req.params.id
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Invoice category not found",
        });
      }

      return res.status(200).json({ success: true, data: category });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async getByName(req: Request, res: Response) {
    try {
      const category = await invoiceCategoryService.getInvoiceCategoryByName(
        req.params.name
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Invoice category not found",
        });
      }

      return res.status(200).json({ success: true, data: category });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, description, multiplier } = req.body ?? {};

      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "name is required",
        });
      }

      if (typeof multiplier !== "number" || !Number.isFinite(multiplier)) {
        return res.status(400).json({
          success: false,
          message: "multiplier is required and must be a number",
        });
      }

      const category = await invoiceCategoryService.createInvoiceCategory({
        name,
        multiplier,
        ...(description !== undefined && { description }),
      });

      return res.status(201).json({
        success: true,
        message: "Invoice category created successfully",
        data: category,
      });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { name, description, multiplier } = req.body ?? {};

      if (
        name === undefined &&
        description === undefined &&
        multiplier === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one of name, description, or multiplier is required",
        });
      }

      if (
        name !== undefined &&
        (typeof name !== "string" || !name.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "name cannot be empty",
        });
      }

      if (
        multiplier !== undefined &&
        (typeof multiplier !== "number" || !Number.isFinite(multiplier))
      ) {
        return res.status(400).json({
          success: false,
          message: "multiplier must be a number",
        });
      }

      const category = await invoiceCategoryService.updateInvoiceCategory(
        req.params.id,
        {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(multiplier !== undefined && { multiplier }),
        }
      );

      return res.status(200).json({
        success: true,
        message: "Invoice category updated successfully",
        data: category,
      });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const result = await invoiceCategoryService.deleteInvoiceCategory(
        req.params.id
      );
      return res.status(200).json({
        success: true,
        message: "Invoice category deleted successfully",
        data: result,
      });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }
}

export const invoiceCategoryController = new InvoiceCategoryController();
