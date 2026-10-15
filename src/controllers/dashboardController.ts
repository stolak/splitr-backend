import { Request, Response } from "express";
import { helperService } from "../services/helperService";
import { buyerDashboardService } from "../services/buyerDashboardService";
import { merchantDashboardService } from "../services/merchantDashboardService";
import { buyerService } from "../services/buyerService";

function parseDashboardDate(value: unknown, field: string): Date | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} must be a valid date`);
  }
  return date;
}

export class DashboardController {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await helperService.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Buyer financing overview: spending power, next payment, upcoming payments, and plans.
   */
  async getBuyerDashboard(req: Request, res: Response) {
    try {
      const userType = req.user?.userType;
      const isAdmin = userType?.toUpperCase() === "ADMIN" || req.user?.role === "SuperAdmin";
      const requestedBuyerId =
        typeof req.query.buyerId === "string" ? req.query.buyerId.trim() : "";

      let buyerId = requestedBuyerId;
      if (!isAdmin) {
        if (userType?.toUpperCase() !== "BUYER") {
          return res.status(403).json({ success: false, message: "Buyer access is required" });
        }
        const buyer = await buyerService.getBuyerByUserId(req.user!.id);
        buyerId = buyer.id;
      } else if (!buyerId) {
        return res.status(400).json({ success: false, message: "buyerId is required" });
      }

      const data = await buyerDashboardService.getDashboard(buyerId);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      const message = error?.message || "Internal server error";
      const status = /not found/i.test(message) ? 404 : 500;
      if (status === 500) console.error("Error getting buyer dashboard:", error);
      return res.status(status).json({ success: false, message });
    }
  }

  /**
   * Merchant portal dashboard: GMV, attention items, settlement snapshot, and recent purchases.
   */
  async getMerchantDashboard(req: Request, res: Response) {
    try {
      const merchantId = typeof req.query.merchantId === "string" ? req.query.merchantId.trim() : "";
      if (!merchantId) {
        return res.status(400).json({ success: false, message: "merchantId is required" });
      }

      const userType = req.user?.userType;
      const isAdmin = userType?.toUpperCase() === "ADMIN" || req.user?.role === "SuperAdmin";
      if (!isAdmin && userType?.toUpperCase() !== "MERCHANT") {
        return res.status(403).json({ success: false, message: "Merchant access is required" });
      }
      if (!isAdmin && req.user?.merchantId !== merchantId) {
        return res.status(403).json({ success: false, message: "You can only view your own merchant dashboard" });
      }

      const outletId = typeof req.query.outletId === "string" ? req.query.outletId.trim() : "";
      const startDate = parseDashboardDate(req.query.startDate, "startDate");
      const endDate = parseDashboardDate(req.query.endDate, "endDate");
      if ((startDate && !endDate) || (!startDate && endDate)) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate must be provided together",
        });
      }

      const data = await merchantDashboardService.getDashboard({
        merchantId,
        ...(outletId ? { outletId } : {}),
        ...(startDate && endDate ? { startDate, endDate } : {}),
      });
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      const message = error?.message || "Internal server error";
      const status = /not found/i.test(message)
        ? 404
        : /required|must be|belong|valid date/i.test(message)
          ? 400
          : 500;
      if (status === 500) console.error("Error getting merchant dashboard:", error);
      return res.status(status).json({ success: false, message });
    }
  }
}

export const dashboardController = new DashboardController();
