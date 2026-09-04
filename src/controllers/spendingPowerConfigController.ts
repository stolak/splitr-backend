import { Request, Response } from "express";
import { spendingPowerConfigService } from "../services/spendingPowerConfigService";

function statusFromError(message: string): number {
  if (
    message.includes("not found") ||
    message.includes("Not found")
  ) {
    return 404;
  }
  if (
    message.includes("required") ||
    message.includes("must be") ||
    message.includes("cannot be") ||
    message.includes("At least one")
  ) {
    return 400;
  }
  return 500;
}

export class SpendingPowerConfigController {
  async get(req: Request, res: Response) {
    try {
      const configId = (req.query.configId as string) || "default";
      const config = await spendingPowerConfigService.getConfig(configId);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: "Spending power config not found",
        });
      }

      return res.status(200).json({ success: true, data: config });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const config = await spendingPowerConfigService.upsertConfig(req.body ?? {});
      return res.status(200).json({
        success: true,
        message: "Spending power config upserted successfully",
        data: config,
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
      const configId = (req.query.configId as string) || "default";
      const result = await spendingPowerConfigService.deleteConfig(configId);
      return res.status(200).json({
        success: true,
        message: "Spending power config deleted successfully",
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

  // ==================== RISK TIERS ====================

  async listRiskTiers(req: Request, res: Response) {
    try {
      const configId = (req.query.configId as string) || "default";
      const tiers = await spendingPowerConfigService.listRiskTiers(configId);
      return res.status(200).json({ success: true, data: tiers });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async getRiskTier(req: Request, res: Response) {
    try {
      const tier = await spendingPowerConfigService.getRiskTierById(req.params.id);
      return res.status(200).json({ success: true, data: tier });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async createRiskTier(req: Request, res: Response) {
    try {
      const {
        minScore,
        maxScore,
        riskTier,
        multiplier,
        maximumExposureCap,
        treatment,
        configId,
      } = req.body ?? {};

      if (
        minScore === undefined ||
        maxScore === undefined ||
        !riskTier ||
        multiplier === undefined ||
        maximumExposureCap === undefined ||
        !treatment
      ) {
        return res.status(400).json({
          success: false,
          message:
            "minScore, maxScore, riskTier, multiplier, maximumExposureCap, and treatment are required",
        });
      }

      const tier = await spendingPowerConfigService.createRiskTier({
        configId,
        minScore,
        maxScore,
        riskTier,
        multiplier,
        maximumExposureCap,
        treatment,
      });

      return res.status(201).json({
        success: true,
        message: "Risk tier created successfully",
        data: tier,
      });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async updateRiskTier(req: Request, res: Response) {
    try {
      const tier = await spendingPowerConfigService.updateRiskTier(
        req.params.id,
        req.body ?? {}
      );
      return res.status(200).json({
        success: true,
        message: "Risk tier updated successfully",
        data: tier,
      });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async deleteRiskTier(req: Request, res: Response) {
    try {
      const result = await spendingPowerConfigService.deleteRiskTier(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Risk tier deleted successfully",
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

  // ==================== BEHAVIOUR TIERS ====================

  async listBehaviourTiers(req: Request, res: Response) {
    try {
      const configId = (req.query.configId as string) || "default";
      const tiers = await spendingPowerConfigService.listBehaviourTiers(configId);
      return res.status(200).json({ success: true, data: tiers });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async getBehaviourTier(req: Request, res: Response) {
    try {
      const tier = await spendingPowerConfigService.getBehaviourTierById(
        req.params.id
      );
      return res.status(200).json({ success: true, data: tier });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async createBehaviourTier(req: Request, res: Response) {
    try {
      const {
        minScore,
        maxScore,
        behaviourTier,
        multiplier,
        treatment,
        configId,
      } = req.body ?? {};

      if (
        minScore === undefined ||
        maxScore === undefined ||
        !behaviourTier ||
        multiplier === undefined ||
        !treatment
      ) {
        return res.status(400).json({
          success: false,
          message:
            "minScore, maxScore, behaviourTier, multiplier, and treatment are required",
        });
      }

      const tier = await spendingPowerConfigService.createBehaviourTier({
        configId,
        minScore,
        maxScore,
        behaviourTier,
        multiplier,
        treatment,
      });

      return res.status(201).json({
        success: true,
        message: "Behaviour tier created successfully",
        data: tier,
      });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async updateBehaviourTier(req: Request, res: Response) {
    try {
      const tier = await spendingPowerConfigService.updateBehaviourTier(
        req.params.id,
        req.body ?? {}
      );
      return res.status(200).json({
        success: true,
        message: "Behaviour tier updated successfully",
        data: tier,
      });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async deleteBehaviourTier(req: Request, res: Response) {
    try {
      const result = await spendingPowerConfigService.deleteBehaviourTier(
        req.params.id
      );
      return res.status(200).json({
        success: true,
        message: "Behaviour tier deleted successfully",
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

export const spendingPowerConfigController = new SpendingPowerConfigController();
