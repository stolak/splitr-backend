import { Request, Response } from "express";
import { merchantBankAccountService } from "../services/merchantBankAccountService";

function queryString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export class MerchantBankAccountController {
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
      return this.ok(res, await merchantBankAccountService.list(queryString(req.query.merchantId)));
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async listByMerchant(req: Request, res: Response) {
    try {
      return this.ok(res, await merchantBankAccountService.list(req.params.merchantId));
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await merchantBankAccountService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Merchant bank account not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await merchantBankAccountService.create(req.body ?? {});
      return this.ok(res, data, "Merchant bank account created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await merchantBankAccountService.update(req.params.id, req.body ?? {});
      return this.ok(res, data, "Merchant bank account updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const data = await merchantBankAccountService.delete(req.params.id);
      return this.ok(res, data, "Merchant bank account deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }
}

export const merchantBankAccountController = new MerchantBankAccountController();
