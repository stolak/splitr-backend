import { Request, Response } from "express";
import { merchantPricingService } from "../services/merchantPricingService";

function queryString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export class MerchantPricingController {
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
      : /required|must be|already exists|at least one/i.test(message)
        ? 400
        : 500;

    if (status === 500) {
      console.error(error);
    }

    return res.status(status).json({ success: false, message });
  }

  async listFeesRates(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.listFeesRates({
        merchantId: queryString(req.query.merchantId),
        productConfigurationId: queryString(req.query.productConfigurationId),
      });
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getFeesRate(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.getFeesRate(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Merchant fees rate not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async createFeesRate(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.createFeesRate(req.body ?? {});
      return this.ok(res, data, "Merchant fees rate created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async updateFeesRate(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.updateFeesRate(req.params.id, req.body ?? {});
      return this.ok(res, data, "Merchant fees rate updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async deleteFeesRate(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.deleteFeesRate(req.params.id);
      return this.ok(res, data, "Merchant fees rate deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async listTiers(_req: Request, res: Response) {
    try {
      const data = await merchantPricingService.listTiers();
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getTier(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.getTier(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Merchant tier not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async createTier(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.createTier(req.body ?? {});
      return this.ok(res, data, "Merchant tier created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async updateTier(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.updateTier(req.params.id, req.body ?? {});
      return this.ok(res, data, "Merchant tier updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async deleteTier(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.deleteTier(req.params.id);
      return this.ok(res, data, "Merchant tier deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async listCutOffs(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.listCutOffs(queryString(req.query.merchantTierId));
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getCutOff(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.getCutOff(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "T cut off not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getCutOffByTier(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.getCutOffByTier(req.params.merchantTierId);
      if (!data) {
        return res.status(404).json({ success: false, message: "T cut off not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async createCutOff(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.createCutOff(req.body ?? {});
      return this.ok(res, data, "T cut off created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async updateCutOff(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.updateCutOff(req.params.id, req.body ?? {});
      return this.ok(res, data, "T cut off updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async deleteCutOff(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.deleteCutOff(req.params.id);
      return this.ok(res, data, "T cut off deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async listReserves(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.listReserves({
        merchantTierId: queryString(req.query.merchantTierId),
        productConfigurationId: queryString(req.query.productConfigurationId),
      });
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async listReservesByTier(_req: Request, res: Response) {
    try {
      const data = await merchantPricingService.listReservesByTier();
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getReserve(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.getReserve(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Rolling reserve not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async createReserve(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.createReserve(req.body ?? {});
      return this.ok(res, data, "Rolling reserve created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async updateReserve(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.updateReserve(req.params.id, req.body ?? {});
      return this.ok(res, data, "Rolling reserve updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async deleteReserve(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.deleteReserve(req.params.id);
      return this.ok(res, data, "Rolling reserve deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async listInstantSettings(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.listInstantSettings(
        queryString(req.query.merchantTierId)
      );
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getInstantSettingsByTier(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.getInstantSettingsByTier(req.params.merchantTierId);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Instant payout settings not found",
        });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getInstantSettings(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.getInstantSettings(req.params.id);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Instant payout settings not found",
        });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async createInstantSettings(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.createInstantSettings(req.body ?? {});
      return this.ok(res, data, "Instant payout settings created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async updateInstantSettings(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.updateInstantSettings(req.params.id, req.body ?? {});
      return this.ok(res, data, "Instant payout settings updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async deleteInstantSettings(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.deleteInstantSettings(req.params.id);
      return this.ok(res, data, "Instant payout settings deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async listDefaultFeesRates(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.listDefaultFeesRates({
        merchantTierId: queryString(req.query.merchantTierId),
        productConfigurationId: queryString(req.query.productConfigurationId),
      });
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async listDefaultFeesRatesByTier(_req: Request, res: Response) {
    try {
      const data = await merchantPricingService.listDefaultFeesRatesByTier();
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getDefaultFeesRate(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.getDefaultFeesRate(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Default fees rate not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async createDefaultFeesRate(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.createDefaultFeesRate(req.body ?? {});
      return this.ok(res, data, "Default fees rate created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async updateDefaultFeesRate(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.updateDefaultFeesRate(req.params.id, req.body ?? {});
      return this.ok(res, data, "Default fees rate updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async deleteDefaultFeesRate(req: Request, res: Response) {
    try {
      const data = await merchantPricingService.deleteDefaultFeesRate(req.params.id);
      return this.ok(res, data, "Default fees rate deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }
}

export const merchantPricingController = new MerchantPricingController();
