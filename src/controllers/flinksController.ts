import { Request, Response } from "express";
import { flinksService, AuthorizeInput } from "../services/flinksService";

/**
 * @openapi
 * /api/v1/flinks/authorize-token:
 *   post:
 *     summary: Generate a Flinks authorize token
 *     description: Calls Flinks BankingServices/GenerateAuthorizeToken for the configured customer.
 *     tags: [Flinks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authorize token generated
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation or Flinks error
 */
export async function generateAuthorizeToken(req: Request, res: Response) {
  try {
    const result = await flinksService.generateAuthorizeToken();
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to generate Flinks authorize token";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/flinks/accounts-detail:
 *   post:
 *     summary: Get Flinks accounts detail
 *     description: >
 *       Calls Flinks BankingServices/GetAccountsDetail using a RequestId from a prior
 *       Authorize call. Returns transactions, KYC, identity, and banking statement data.
 *     tags: [Flinks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId]
 *             properties:
 *               requestId:
 *                 type: string
 *               withAccountIdentity:
 *                 type: boolean
 *                 default: true
 *               withKYC:
 *                 type: boolean
 *                 default: true
 *               withTransactions:
 *                 type: boolean
 *                 default: true
 *               daysOfTransactions:
 *                 type: string
 *                 default: Days90
 *               withDetailsAndBankingStatements:
 *                 type: boolean
 *                 default: false
 *               numberOfBankingStatements:
 *                 type: string
 *                 default: MostRecent
 *     responses:
 *       200:
 *         description: Accounts detail retrieved
 *       400:
 *         description: Validation or Flinks error
 *       401:
 *         description: Unauthorized
 */
export async function getAccountsDetail(req: Request, res: Response) {
  try {
    const {
      requestId,
      withAccountIdentity,
      withKYC,
      withTransactions,
      daysOfTransactions,
      withDetailsAndBankingStatements,
      numberOfBankingStatements,
    } = req.body as {
      requestId: string;
      withAccountIdentity?: boolean;
      withKYC?: boolean;
      withTransactions?: boolean;
      daysOfTransactions?: string;
      withDetailsAndBankingStatements?: boolean;
      numberOfBankingStatements?: string;
    };

    if (!requestId) {
      return res.status(400).json({ message: "requestId is required" });
    }

    const result = await flinksService.getAccountsDetail({
      requestId,
      withAccountIdentity,
      withKYC,
      withTransactions,
      daysOfTransactions,
      withDetailsAndBankingStatements,
      numberOfBankingStatements,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to get Flinks accounts detail";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/flinks/accounts-summary:
 *   post:
 *     summary: Get Flinks accounts summary
 *     description: >
 *       Calls Flinks BankingServices/GetAccountsSummary using a RequestId obtained
 *       from a prior Authorize call. Returns account balances and holder details.
 *     tags: [Flinks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId]
 *             properties:
 *               requestId:
 *                 type: string
 *                 description: The RequestId returned from the Authorize endpoint
 *               withBalance:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Accounts summary retrieved
 *       400:
 *         description: Validation or Flinks error
 *       401:
 *         description: Unauthorized
 */
export async function getAccountsSummary(req: Request, res: Response) {
  try {
    const { requestId, withBalance } = req.body as {
      requestId: string;
      withBalance?: boolean;
    };

    if (!requestId) {
      return res.status(400).json({ message: "requestId is required" });
    }

    const result = await flinksService.getAccountsSummary({ requestId, withBalance });
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to get Flinks accounts summary";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/flinks/authorize:
 *   post:
 *     summary: Authorize a Flinks login
 *     description: >
 *       Calls Flinks BankingServices/Authorize with a LoginId and returns
 *       the linked account details and available resource links.
 *     tags: [Flinks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [loginId]
 *             properties:
 *               loginId:
 *                 type: string
 *                 description: The Flinks LoginId (UUID)
 *               mostRecentCached:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Authorization successful
 *       400:
 *         description: Validation or Flinks error
 *       401:
 *         description: Unauthorized
 */
export async function authorize(req: Request, res: Response) {
  try {
    const { loginId, mostRecentCached } = req.body as AuthorizeInput & {
      mostRecentCached?: boolean;
    };

    if (!loginId) {
      return res.status(400).json({ message: "loginId is required" });
    }

    const result = await flinksService.authorize({ loginId, mostRecentCached });
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to authorize Flinks login";
    return res.status(400).json({ message });
  }
}
