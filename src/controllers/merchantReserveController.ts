import { Request, Response } from "express";
import { ReserveStatus } from "@prisma/client";
import {
  RESERVE_STATUSES,
  merchantReserveContributionService,
  merchantReserveReleaseService,
} from "../services/merchantReserveService";

function queryString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readStatus(value: unknown, res: Response): ReserveStatus | undefined | null {
  const reserveStatus = queryString(value);
  if (!reserveStatus) return undefined;
  if (!RESERVE_STATUSES.includes(reserveStatus as ReserveStatus)) {
    res.status(400).json({
      success: false,
      message: `reserveStatus must be one of ${RESERVE_STATUSES.join(", ")}`,
    });
    return null;
  }
  return reserveStatus as ReserveStatus;
}

class ReserveController {
  protected ok(res: Response, data: unknown, message?: string, status = 200) {
    return res.status(status).json({
      success: true,
      ...(message ? { message } : {}),
      data,
    });
  }

  protected fail(res: Response, error: any) {
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
}

export class MerchantReserveReleaseController extends ReserveController {
  async list(req: Request, res: Response) {
    try {
      const reserveStatus = readStatus(req.query.reserveStatus, res);
      if (reserveStatus === null) return;

      const data = await merchantReserveReleaseService.list({
        merchantId: queryString(req.query.merchantId),
        reserveReference: queryString(req.query.reserveReference),
        releaseReference: queryString(req.query.releaseReference),
        ...(reserveStatus && { reserveStatus }),
      });
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await merchantReserveReleaseService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Merchant reserve release not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await merchantReserveReleaseService.create(req.body ?? {});
      return this.ok(res, data, "Merchant reserve release created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await merchantReserveReleaseService.update(req.params.id, req.body ?? {});
      return this.ok(res, data, "Merchant reserve release updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const data = await merchantReserveReleaseService.delete(req.params.id);
      return this.ok(res, data, "Merchant reserve release deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }
}

export class MerchantReserveContributionController extends ReserveController {
  async list(req: Request, res: Response) {
    try {
      const reserveStatus = readStatus(req.query.reserveStatus, res);
      if (reserveStatus === null) return;

      const data = await merchantReserveContributionService.list({
        merchantId: queryString(req.query.merchantId),
        batchReference: queryString(req.query.batchReference),
        ...(reserveStatus && { reserveStatus }),
      });
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await merchantReserveContributionService.getById(req.params.id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: "Merchant reserve contribution not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await merchantReserveContributionService.create(req.body ?? {});
      return this.ok(res, data, "Merchant reserve contribution created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await merchantReserveContributionService.update(req.params.id, req.body ?? {});
      return this.ok(res, data, "Merchant reserve contribution updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const data = await merchantReserveContributionService.delete(req.params.id);
      return this.ok(res, data, "Merchant reserve contribution deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }
}

export const merchantReserveReleaseController = new MerchantReserveReleaseController();
export const merchantReserveContributionController = new MerchantReserveContributionController();
