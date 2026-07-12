import { Request, Response } from "express";
import { Strategy } from "plaid";
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
 *       properties:
 *         count:
 *           type: integer
 *           default: 1
 *           description: Number of bank income reports to fetch
 *     PlaidIdentityVerificationCreateInput:
 *       type: object
 *       properties:
 *         isShareable:
 *           type: boolean
 *           default: false
 *         gaveConsent:
 *           type: boolean
 *           default: false
 *         isIdempotent:
 *           type: boolean
 *           default: true
 *         templateId:
 *           type: string
 *           description: Overrides PLAID_IDV_TEMPLATE_ID when provided
 *         user:
 *           type: object
 *           description: Optional prefill data to skip Link data-collection screens
 *     PlaidIdentityVerificationRetryInput:
 *       type: object
 *       properties:
 *         strategy:
 *           type: string
 *           enum: [reset, incomplete, infer, custom]
 *           default: infer
 *         templateId:
 *           type: string
 *         isShareable:
 *           type: boolean
 *         user:
 *           type: object
 *     PlaidIdentityVerificationLinkTokenInput:
 *       type: object
 *       properties:
 *         templateId:
 *           type: string
 *         gaveConsent:
 *           type: boolean
 *           default: false
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
 *     description: Fetches bank income for the authenticated user using the Plaid user created during link token setup.
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

    const { count } = req.body || {};

    const result = await plaidService.getBankIncomeRest(
      userId,
      count !== undefined ? Number(count) : 1
    );

    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to fetch bank income";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/plaid/identity-verification:
 *   post:
 *     summary: Create a Plaid Identity Verification
 *     description: Creates an Identity Verification session for the authenticated user.
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaidIdentityVerificationCreateInput'
 *     responses:
 *       201:
 *         description: Identity verification created
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation or Plaid error
 */
export async function createIdentityVerification(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { isShareable, gaveConsent, isIdempotent, templateId, user } =
      req.body || {};

    const result = await plaidService.createIdentityVerification(userId, {
      isShareable,
      gaveConsent,
      isIdempotent,
      templateId,
      user,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to create identity verification";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/plaid/identity-verification/{id}:
 *   get:
 *     summary: Get a Plaid Identity Verification
 *     description: Retrieves a previously created Identity Verification by ID.
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Identity verification retrieved
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation or Plaid error
 */
export async function getIdentityVerification(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await plaidService.getIdentityVerification(req.params.id);
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to get identity verification";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/plaid/identity-verification:
 *   get:
 *     summary: List Plaid Identity Verifications
 *     description: Lists Identity Verifications for the authenticated user and template.
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Identity verifications listed
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation or Plaid error
 */
export async function listIdentityVerifications(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const templateId =
      typeof req.query.templateId === "string" ? req.query.templateId : undefined;
    const cursor =
      typeof req.query.cursor === "string" ? req.query.cursor : undefined;

    const result = await plaidService.listIdentityVerifications(userId, {
      templateId,
      cursor,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to list identity verifications";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/plaid/identity-verification/retry:
 *   post:
 *     summary: Retry a Plaid Identity Verification
 *     description: Creates a retry Identity Verification session for the authenticated user.
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaidIdentityVerificationRetryInput'
 *     responses:
 *       201:
 *         description: Identity verification retry created
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation or Plaid error
 */
export async function retryIdentityVerification(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { strategy, templateId, isShareable, user } = req.body || {};
    const validStrategies = Object.values(Strategy);

    if (strategy !== undefined && !validStrategies.includes(strategy)) {
      return res.status(400).json({
        message: `strategy must be one of: ${validStrategies.join(", ")}`,
      });
    }

    const result = await plaidService.retryIdentityVerification(userId, {
      strategy,
      templateId,
      isShareable,
      user,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to retry identity verification";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/plaid/identity-verification/link-token:
 *   post:
 *     summary: Create a Plaid Link token for Identity Verification
 *     description: Creates a link_token configured for the Identity Verification product.
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaidIdentityVerificationLinkTokenInput'
 *     responses:
 *       201:
 *         description: Identity verification link token created
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation or Plaid error
 */
export async function createIdentityVerificationLinkToken(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { templateId, gaveConsent } = req.body || {};

    const result = await plaidService.createIdentityVerificationLinkToken(
      userId,
      { templateId, gaveConsent }
    );

    return res.status(201).json(result);
  } catch (error: any) {
    const message =
      error?.message || "Failed to create identity verification link token";
    return res.status(400).json({ message });
  }
}
