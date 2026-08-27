import { Request, Response } from "express";
import { creditBureauService } from "../services/creditBureauService";

function statusFromError(message: string): number {
  if (message.includes("not found") || message.includes("Not found")) {
    return 404;
  }
  if (message.includes("required") || message.includes("must be")) {
    return 400;
  }
  return 500;
}

export class CreditBureauController {
  async create(req: Request, res: Response) {
    try {
      const data = await creditBureauService.create(req.body ?? {});
      return res.status(201).json({
        success: true,
        message: "Credit bureau record created successfully",
        data,
      });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const buyerId = req.query.buyerId as string | undefined;
      const data = await creditBureauService.list(buyerId);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async getByBuyerId(req: Request, res: Response) {
    try {
      const data = await creditBureauService.getByBuyerId(req.params.buyerId);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await creditBureauService.getById(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      const message = error.message || "Internal server error";
      return res.status(statusFromError(message)).json({
        success: false,
        message,
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await creditBureauService.update(req.params.id, req.body ?? {});
      return res.status(200).json({
        success: true,
        message: "Credit bureau record updated successfully",
        data,
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
      const data = await creditBureauService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Credit bureau record deleted successfully",
        data,
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

export const creditBureauController = new CreditBureauController();
