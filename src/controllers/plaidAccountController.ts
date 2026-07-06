import { Request, Response } from "express";
import { plaidAccountService } from "../services/plaidAccountService";

export class PlaidAccountController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { buyerId, linkToken, expiration, publicToken, itemId, requestId } = req.body || {};

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const result = await plaidAccountService.createPlaidAccount({
        userId,
        buyerId: buyerId ?? (req.user as any)?.buyerId,
        linkToken,
        expiration,
        publicToken,
        itemId,
        requestId,
      });

      if (result.success) {
        return res.status(201).json(result);
      }

      return res.status(400).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await plaidAccountService.getPlaidAccountById(req.params.id);

      if (!result.success || !result.data) {
        return res.status(404).json(result);
      }

      if (result.data.userId !== userId) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const buyerId = req.query.buyerId as string | undefined;
      const result = await plaidAccountService.listPlaidAccounts({
        userId,
        buyerId,
      });

      if (result.success) {
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getByBuyerId(req: Request, res: Response) {
    try {
      const result = await plaidAccountService.getPlaidAccountsByBuyerId(req.params.buyerId);

      if (result.success) {
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getByUserId(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId || userId !== req.params.userId) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const result = await plaidAccountService.getPlaidAccountsByUserId(req.params.userId);

      if (result.success) {
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const existing = await plaidAccountService.getPlaidAccountById(req.params.id);

      if (!existing.success || !existing.data) {
        return res.status(404).json(existing);
      }

      if (existing.data.userId !== userId) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const { buyerId, linkToken, expiration, publicToken, itemId, requestId } = req.body || {};
      const result = await plaidAccountService.updatePlaidAccount(req.params.id, {
        buyerId,
        linkToken,
        expiration,
        publicToken,
        itemId,
        requestId,
      });

      if (result.success) {
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const existing = await plaidAccountService.getPlaidAccountById(req.params.id);

      if (!existing.success || !existing.data) {
        return res.status(404).json(existing);
      }

      if (existing.data.userId !== userId) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const result = await plaidAccountService.deletePlaidAccount(req.params.id);

      if (result.success) {
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const plaidAccountController = new PlaidAccountController();
