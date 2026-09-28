import { Request, Response } from "express";
import { nextSettlementScheduleService } from "../services/nextSettlementScheduleService";

export class NextSettlementScheduleController {
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
      : /required|must be|at least one/i.test(message)
        ? 400
        : 500;

    if (status === 500) {
      console.error(error);
    }

    return res.status(status).json({ success: false, message });
  }

  async get(_req: Request, res: Response) {
    try {
      const data = await nextSettlementScheduleService.get();
      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: "Next settlement schedule not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const data = await nextSettlementScheduleService.upsert(req.body ?? {});
      return this.ok(res, data, "Next settlement schedule upserted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }
}

export const nextSettlementScheduleController = new NextSettlementScheduleController();
