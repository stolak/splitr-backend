import {
  CampaignFunding,
  CampaignInitiatedBy,
  CampaignStatus,
} from "@prisma/client";
import { Request, Response } from "express";
import { campaignService } from "../services/campaignService";
import {
  CampaignActor,
  isAdminActor,
  normalizeCampaignStatus,
} from "../services/campaignRules";

function queryString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function actorFromRequest(req: Request): CampaignActor | null {
  if (!req.user?.id) return null;
  return {
    userId: req.user.id,
    userType: req.user.userType,
    role: req.user.role,
    merchantId: req.user.merchantId ?? null,
  };
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
      : /Unauthorized/i.test(message)
        ? 403
        : /required|must be|already exists|at least one|belong|between|greater than|not part of|duplicated|cannot/i.test(
              message
            )
          ? 400
          : 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ success: false, message });
  }

  async list(req: Request, res: Response) {
    try {
      const actor = actorFromRequest(req);
      if (!actor) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const statusRaw = queryString(req.query.status);
      const status = statusRaw ? normalizeCampaignStatus(statusRaw) : undefined;
      if (statusRaw && !status) {
        return res.status(400).json({
          success: false,
          message: `status must be ${Object.values(CampaignStatus).join(", ")} (or Cancelled)`,
        });
      }

      const initiatedBy = queryString(req.query.initiatedBy);
      if (
        initiatedBy &&
        !Object.values(CampaignInitiatedBy).includes(initiatedBy as CampaignInitiatedBy)
      ) {
        return res.status(400).json({
          success: false,
          message: `initiatedBy must be ${Object.values(CampaignInitiatedBy).join(", ")}`,
        });
      }

      const funding = queryString(req.query.funding);
      if (funding && !Object.values(CampaignFunding).includes(funding as CampaignFunding)) {
        return res.status(400).json({
          success: false,
          message: `funding must be ${Object.values(CampaignFunding).join(", ")}`,
        });
      }

      const adminView = isAdminActor(actor);
      return this.ok(
        res,
        await campaignService.list({
          // Admins see all campaigns; merchants may optionally filter by merchantId query
          merchantId: adminView ? undefined : queryString(req.query.merchantId) || actor.merchantId || undefined,
          status: status ?? undefined,
          initiatedBy: initiatedBy as CampaignInitiatedBy | undefined,
          funding: funding as CampaignFunding | undefined,
          q: queryString(req.query.q),
          adminView,
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

      const statusRaw = queryString(req.query.status);
      const status = statusRaw ? normalizeCampaignStatus(statusRaw) : undefined;
      if (statusRaw && !status) {
        return res.status(400).json({
          success: false,
          message: `status must be ${Object.values(CampaignStatus).join(", ")} (or Cancelled)`,
        });
      }

      const initiatedBy = queryString(req.query.initiatedBy);
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
          status: status ?? undefined,
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
      const actor = actorFromRequest(req);
      if (!actor) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const body = { ...(req.body ?? {}) };
      if (!body.merchantId && actor.merchantId) {
        body.merchantId = actor.merchantId;
      }

      const data = await campaignService.create(body, actor);
      return this.ok(res, data, "Campaign created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const actor = actorFromRequest(req);
      if (!actor) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const data = await campaignService.update(req.params.id, req.body ?? {}, actor);
      return this.ok(res, data, "Campaign updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  /**
   * Consolidated workflow: approve | pause | cancel | resume | statusRemarks
   */
  async actions(req: Request, res: Response) {
    try {
      const actor = actorFromRequest(req);
      if (!actor) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const rawAction =
        typeof req.body?.action === "string" ? req.body.action.trim() : "";
      const action = rawAction.toLowerCase();
      const remark = req.body?.remark ?? req.body?.remarks;
      const id = req.params.id;

      switch (action) {
        case "approve": {
          const data = await campaignService.approveCampaign(id, actor, {
            approvedRemarks: req.body?.approvedRemarks ?? remark,
          });
          return this.ok(res, data, "Campaign approved successfully");
        }
        case "pause": {
          const data = await campaignService.pause(id, actor, remark);
          return this.ok(res, data, "Campaign paused successfully");
        }
        case "cancel":
        case "cancelled": {
          const data = await campaignService.cancel(id, actor, remark);
          return this.ok(res, data, "Campaign cancelled successfully");
        }
        case "resume": {
          const data = await campaignService.resume(id, actor, remark);
          return this.ok(res, data, "Campaign resumed successfully");
        }
        case "statusremarks":
        case "status_remarks":
        case "status-remarks": {
          const data = await campaignService.listStatusRemarks(id);
          return this.ok(res, data);
        }
        default:
          return res.status(400).json({
            success: false,
            message:
              "action must be one of: approve, pause, cancel, resume, statusRemarks",
          });
      }
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async approveMerchant(req: Request, res: Response) {
    try {
      const actor = actorFromRequest(req);
      if (!actor) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const isAdmin = isAdminActor(actor);
      const bodyMerchantId =
        typeof req.body?.merchantId === "string" ? req.body.merchantId.trim() : "";
      const merchantId = isAdmin ? bodyMerchantId : actor.merchantId;

      if (!merchantId) {
        return res.status(400).json({
          success: false,
          message: isAdmin
            ? "merchantId is required"
            : "Merchant access is required",
        });
      }
      if (!isAdmin && (actor.userType ?? "").toUpperCase() !== "MERCHANT") {
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
        approvedById: actor.userId,
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
