import { Request, Response } from "express";
import { outletService } from "../services/outletService";

function queryString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export class OutletController {
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
      : /required|must be|already exists|at least one|belongs to/i.test(message)
        ? 400
        : 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ success: false, message });
  }

  async list(req: Request, res: Response) {
    try {
      return this.ok(res, await outletService.list(queryString(req.query.merchantId)));
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async listByMerchant(req: Request, res: Response) {
    try {
      return this.ok(res, await outletService.list(req.params.merchantId));
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await outletService.getById(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Outlet not found" });
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await outletService.create(req.body ?? {});
      return this.ok(res, data, "Outlet created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await outletService.update(req.params.id, req.body ?? {});
      return this.ok(res, data, "Outlet updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const data = await outletService.delete(req.params.id);
      return this.ok(res, data, "Outlet deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }
}

export const outletController = new OutletController();
