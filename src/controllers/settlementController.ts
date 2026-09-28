import { Request, Response } from "express";
import { SettlementRecordType } from "@prisma/client";
import { SETTLEMENT_RECORD_TYPES, settlementService } from "../services/settlementService";

function queryString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export class SettlementController {
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

  async list(req: Request, res: Response) {
    try {
      const settlementRecordType = queryString(req.query.settlementRecordType);
      if (
        settlementRecordType &&
        !SETTLEMENT_RECORD_TYPES.includes(settlementRecordType as SettlementRecordType)
      ) {
        return res.status(400).json({
          success: false,
          message: `settlementRecordType must be one of ${SETTLEMENT_RECORD_TYPES.join(", ")}`,
        });
      }

      const data = await settlementService.list({
        merchantId: queryString(req.query.merchantId),
        batchReference: queryString(req.query.batchReference),
        ...(settlementRecordType && {
          settlementRecordType: settlementRecordType as SettlementRecordType,
        }),
      });
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async computePendingSettlement(req: Request, res: Response) {
    try {
      const merchantId = queryString(req.query.merchantId);
      if (!merchantId) {
        return res.status(400).json({ success: false, message: "merchantId is required" });
      }
      const data = await settlementService.computeMarchanetPendingSettlement({ merchantId });
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getUnsettledBalance(req: Request, res: Response) {
    try {
      const merchantId = queryString(req.query.merchantId);
      if (!merchantId) {
        return res.status(400).json({ success: false, message: "merchantId is required" });
      }
      const balance = await settlementService.getUnsettledBalance(merchantId);
      return this.ok(res, { merchantId, balance });
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async instantSettlement(req: Request, res: Response) {
    try {
      const merchantId =
        queryString(req.body?.merchantId) ?? queryString(req.query.merchantId);
      if (!merchantId) {
        return res.status(400).json({ success: false, message: "merchantId is required" });
      }
      const data = await settlementService.instantSettleMent({ merchantId });
      return this.ok(res, data, "Instant settlement completed successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await settlementService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Settlement not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await settlementService.create(req.body ?? {});
      if (!data) {
        return this.ok(res, null, "Settlement skipped because debit and credit are both zero");
      }
      return this.ok(res, data, "Settlement created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await settlementService.update(req.params.id, req.body ?? {});
      return this.ok(res, data, "Settlement updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const data = await settlementService.delete(req.params.id);
      return this.ok(res, data, "Settlement deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async removeByBatchReference(req: Request, res: Response) {
    try {
      const batchReference = queryString(req.params.batchReference);
      if (!batchReference) {
        return res.status(400).json({ success: false, message: "batchReference is required" });
      }
      const data = await settlementService.deleteByBatchReference(batchReference);
      return this.ok(res, data, "Settlements deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }
}

export const settlementController = new SettlementController();
