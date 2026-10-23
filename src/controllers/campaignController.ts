import {
  CampaignInitiatedBy,
  CampaignStatus,
} from "@prisma/client";
import { Request, Response } from "express";
import { campaignService } from "../services/campaignService";

function queryString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export class CampaignController {
  private ok(res: Response, data: unknown, message?: string, status = 200) {
    return res.status(status).json({
      success: true,
      ...(message ? { message } : {}),
      data,
    });
  }

  private fail(res: Response, error: any) {
    const message = error?.message || "Internal server error";
    const status = /not found/i.test(message)
      ? 404
      : /required|must be|already exists|at least one|belong|between|greater than|not part of|duplicated|Unauthorized/i.test(
            message
          )
        ? 400
        : 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ success: false, message });
  }

  async list(req: Request, res: Response) {
    try {
      const status = queryString(req.query.status);
      const initiatedBy = queryString(req.query.initiatedBy);
      if (status && !Object.values(CampaignStatus).includes(status as CampaignStatus)) {
        return res.status(400).json({
          success: false,
          message: `status must be ${Object.values(CampaignStatus).join(", ")}`,
        });
      }
      if (
        initiatedBy &&
        !Object.values(CampaignInitiatedBy).includes(initiatedBy as CampaignInitiatedBy)
      ) {
        return res.status(400).json({
          success: false,
          message: `initiatedBy must be ${Object.values(CampaignInitiatedBy).join(", ")}`,
        });
      }

      return this.ok(
        res,
        await campaignService.list({
          merchantId: queryString(req.query.merchantId),
          status: status as CampaignStatus | undefined,
          initiatedBy: initiatedBy as CampaignInitiatedBy | undefined,
          q: queryString(req.query.q),
        })
      );
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async listByMerchant(req: Request, res: Response) {
    try {
      const merchantId = req.params.merchantId?.trim();
      if (!merchantId) {
        return res.status(400).json({ success: false, message: "merchantId is required" });
      }

      const status = queryString(req.query.status);
      const initiatedBy = queryString(req.query.initiatedBy);
      if (status && !Object.values(CampaignStatus).includes(status as CampaignStatus)) {
        return res.status(400).json({
          success: false,
          message: `status must be ${Object.values(CampaignStatus).join(", ")}`,
        });
      }
      if (
        initiatedBy &&
        !Object.values(CampaignInitiatedBy).includes(initiatedBy as CampaignInitiatedBy)
      ) {
        return res.status(400).json({
          success: false,
          message: `initiatedBy must be ${Object.values(CampaignInitiatedBy).join(", ")}`,
        });
      }

      return this.ok(
        res,
        await campaignService.listByMerchant(merchantId, {
          status: status as CampaignStatus | undefined,
          initiatedBy: initiatedBy as CampaignInitiatedBy | undefined,
          q: queryString(req.query.q),
        })
      );
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await campaignService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Campaign not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getByCode(req: Request, res: Response) {
    try {
      const data = await campaignService.getByCode(req.params.campaignCode);
      if (!data) {
        return res.status(404).json({ success: false, message: "Campaign not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const createdById = req.user?.id;
      if (!createdById) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const body = { ...(req.body ?? {}) };
      if (!body.merchantId && req.user?.merchantId) {
        body.merchantId = req.user.merchantId;
      }

      const data = await campaignService.create(body, createdById);
      return this.ok(res, data, "Campaign created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await campaignService.update(req.params.id, req.body ?? {});
      return this.ok(res, data, "Campaign updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async approveMerchant(req: Request, res: Response) {
    try {
      const approvedById = req.user?.id;
      if (!approvedById) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const userType = req.user?.userType?.toUpperCase();
      const isAdmin = userType === "ADMIN" || req.user?.role === "SuperAdmin";
      const bodyMerchantId =
        typeof req.body?.merchantId === "string" ? req.body.merchantId.trim() : "";
      const merchantId = isAdmin ? bodyMerchantId : req.user?.merchantId;

      if (!merchantId) {
        return res.status(400).json({
          success: false,
          message: isAdmin
            ? "merchantId is required"
            : "Merchant access is required",
        });
      }
      if (!isAdmin && userType !== "MERCHANT") {
        return res.status(403).json({ success: false, message: "Merchant access is required" });
      }
      if (!isAdmin && bodyMerchantId && bodyMerchantId !== merchantId) {
        return res.status(403).json({
          success: false,
          message: "You can only approve your own merchant participation",
        });
      }

      const data = await campaignService.approveMerchantParticipation(req.params.id, {
        merchantId,
        approvedById,
        approved: req.body?.approved,
        approvedRemarks: req.body?.approvedRemarks,
      });
      return this.ok(res, data, "Campaign merchant approval updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const data = await campaignService.delete(req.params.id);
      return this.ok(res, data, "Campaign deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }
}

export const campaignController = new CampaignController();
