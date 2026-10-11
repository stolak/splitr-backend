import { Request, Response } from "express";
import { helperService } from "../services/helperService";
import { buyerDashboardService } from "../services/buyerDashboardService";
import { buyerService } from "../services/buyerService";

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
}

export const dashboardController = new DashboardController();
