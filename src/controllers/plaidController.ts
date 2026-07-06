import { Request, Response } from "express";
import { plaidService } from "../services/plaidService";

/**
 * @openapi
 * components:
 *   schemas:
 *     PlaidLinkTokenResponse:
 *       type: object
 *       properties:
 *         linkToken:
 *           type: string
 *           description: Token passed to Plaid Link on the client
 *         expiration:
 *           type: string
 *           format: date-time
 *         plaidAccountId:
 *           type: string
 *           format: uuid
 *     PlaidExchangePublicTokenInput:
 *       type: object
 *       required:
 *         - publicToken
 *       properties:
 *         publicToken:
 *           type: string
 *           description: Public token returned by Plaid Link on success
 *     PlaidExchangePublicTokenResponse:
 *       type: object
 *       properties:
 *         itemId:
 *           type: string
 *         requestId:
 *           type: string
 *         plaidAccountId:
 *           type: string
 *           format: uuid
 *     PlaidBankIncomeInput:
 *       type: object
 *       required:
 *         - userToken
 *       properties:
 *         userToken:
 *           type: string
 *           description: Plaid user token for the linked user
 *         count:
 *           type: integer
 *           default: 1
 *           description: Number of bank income reports to fetch
 */

/**
 * @openapi
 * /api/v1/plaid/link-token:
 *   post:
 *     summary: Create a Plaid Link token
 *     description: Creates a link_token for initializing Plaid Link for the authenticated user.
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Link token created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlaidLinkTokenResponse'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation or Plaid error
 */
export async function createLinkToken(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await plaidService.createLinkToken(userId);
    return res.status(201).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to create Plaid link token";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/plaid/exchange-public-token:
 *   post:
 *     summary: Exchange a Plaid public token
 *     description: Exchanges the public_token from Plaid Link for a permanent item_id and access token.
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaidExchangePublicTokenInput'
 *     responses:
 *       200:
 *         description: Public token exchanged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlaidExchangePublicTokenResponse'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation or Plaid error
 */
export async function exchangePublicToken(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { publicToken } = req.body || {};

    if (!publicToken) {
      return res.status(400).json({ message: "publicToken is required" });
    }

    const result = await plaidService.exchangePublicToken(userId, publicToken);

    return res.status(200).json({
      itemId: result.itemId,
      requestId: result.requestId,
      plaidAccountId: result.plaidAccountId,
    });
  } catch (error: any) {
    const message = error?.message || "Failed to exchange public token";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/plaid/bank-income:
 *   post:
 *     summary: Get Plaid bank income
 *     description: Fetches bank income data for a user via Plaid's credit/bank_income/get endpoint.
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaidBankIncomeInput'
 *     responses:
 *       200:
 *         description: Bank income retrieved
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation or Plaid error
 */
export async function getBankIncome(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userToken, count } = req.body || {};

    if (!userToken) {
      return res.status(400).json({ message: "userToken is required" });
    }

    const result = await plaidService.getBankIncome({
      userToken,
      count: count !== undefined ? Number(count) : undefined,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to fetch bank income";
    return res.status(400).json({ message });
  }
}
