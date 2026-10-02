import { Request, Response } from "express";
import { stripeCardholderService } from "../services/stripeCardholderService";

export class StripeCardholderController {
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
      const buyerId = typeof req.query.buyerId === "string" ? req.query.buyerId.trim() : undefined;
      return this.ok(res, await stripeCardholderService.list(buyerId || undefined));
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getByBuyerId(req: Request, res: Response) {
    try {
      const data = await stripeCardholderService.getByBuyerId(req.params.buyerId);
      if (!data) {
        return res.status(404).json({ success: false, message: "Stripe cardholder not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await stripeCardholderService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Stripe cardholder not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await stripeCardholderService.create(req.body ?? {});
      return this.ok(res, data, "Stripe cardholder created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const data = await stripeCardholderService.upsert(req.body ?? {});
      return this.ok(res, data, "Stripe cardholder upserted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await stripeCardholderService.update(req.params.id, req.body ?? {});
      return this.ok(res, data, "Stripe cardholder updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const data = await stripeCardholderService.delete(req.params.id);
      return this.ok(res, data, "Stripe cardholder deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }
}

export const stripeCardholderController = new StripeCardholderController();
