import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { stripeService } from "../services/stripeService";

/**
 * @openapi
 * components:
 *   schemas:
 *     StripeCustomerInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *     StripeCustomerResponse:
 *       type: object
 *       properties:
 *         customerId:
 *           type: string
 *           example: cus_abc123
 *     StripeSetupIntentInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         customerId:
 *           type: string
 *           description: Optional existing Stripe customer ID; if omitted a new customer is created
 *           example: cus_abc123
 *     StripeSetupIntentResponse:
 *       type: object
 *       properties:
 *         customerId:
 *           type: string
 *         setupIntentId:
 *           type: string
 *         clientSecret:
 *           type: string
 *           description: Pass to Stripe.js on the client to confirm the setup intent
 *     StripeInvoiceSetupIntentInput:
 *       type: object
 *       required:
 *         - invoiceId
 *       properties:
 *         invoiceId:
 *           type: string
 *           format: uuid
 *         buyerId:
 *           type: string
 *           format: uuid
 *           description: Optional; defaults to the authenticated buyer
 *     StripeInvoiceSetupIntentResponse:
 *       type: object
 *       properties:
 *         customerId:
 *           type: string
 *         setupIntentId:
 *           type: string
 *         clientSecret:
 *           type: string
 *         mandateId:
 *           type: string
 *           format: uuid
 *         invoiceId:
 *           type: string
 *           format: uuid
 *         buyerId:
 *           type: string
 *           format: uuid
 *     StripeCompleteMandateInput:
 *       type: object
 *       required:
 *         - customerId
 *       properties:
 *         customerId:
 *           type: string
 *           example: cus_abc123
 *         paymentMethodId:
 *           type: string
 *           example: pm_abc123
 *         setupIntentId:
 *           type: string
 *           description: Used to resolve paymentMethodId when paymentMethodId is not provided
 *           example: seti_abc123
 *         signed:
 *           type: boolean
 *           default: false
 *         name:
 *           type: string
 *         email:
 *           type: string
 *     StripeMandateRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         customerId:
 *           type: string
 *         paymentMethodId:
 *           type: string
 *           nullable: true
 *         setupIntentId:
 *           type: string
 *           nullable: true
 *         name:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           nullable: true
 *         signed:
 *           type: boolean
 *         status:
 *           type: string
 *           enum: [Active, Inactive, Revoked]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     StripeChargeMandateInput:
 *       type: object
 *       required:
 *         - mandateId
 *         - amount
 *       properties:
 *         mandateId:
 *           type: string
 *           format: uuid
 *           description: Local stripe_mandate record ID
 *         amount:
 *           type: integer
 *           description: Amount in the smallest currency unit (e.g. cents for USD)
 *           example: 5000
 *         currency:
 *           type: string
 *           default: usd
 *           example: usd
 *         description:
 *           type: string
 *           example: Loan repayment
 *     StripeChargeResponse:
 *       type: object
 *       properties:
 *         paymentIntentId:
 *           type: string
 *         status:
 *           type: string
 *         amount:
 *           type: integer
 *         currency:
 *           type: string
 *     StripePaymentIntentInput:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: integer
 *           description: Amount in the smallest currency unit (e.g. cents for USD)
 *           example: 5000
 *         currency:
 *           type: string
 *           default: usd
 *           example: usd
 *         description:
 *           type: string
 *           example: One-off payment
 *     StripePaymentIntentResponse:
 *       type: object
 *       properties:
 *         paymentIntentId:
 *           type: string
 *         clientSecret:
 *           type: string
 *           description: Pass to Stripe.js on the client to confirm the payment
 */

/**
 * @openapi
 * /api/v1/stripe/customers:
 *   post:
 *     summary: Create a Stripe customer
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StripeCustomerInput'
 *     responses:
 *       201:
 *         description: Customer created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StripeCustomerResponse'
 *       400:
 *         description: Validation or Stripe error
 *       500:
 *         description: Server error
 */
export async function createCustomer(req: Request, res: Response) {
  try {
    const { name, email } = req.body || {};
    const result = await stripeService.createCustomer({ name, email });
    return res.status(201).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to create Stripe customer";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/customers/{customerId}:
 *   get:
 *     summary: Get a Stripe customer by ID
 *     tags: [Stripe]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         example: cus_abc123
 *     responses:
 *       200:
 *         description: Customer retrieved
 *       404:
 *         description: Customer not found
 *       400:
 *         description: Validation or Stripe error
 */
export async function getCustomer(req: Request, res: Response) {
  try {
    const { customerId } = req.params;
    const result = await stripeService.getCustomer(customerId);
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to retrieve customer";
    if (error?.code === "resource_missing" || error?.statusCode === 404) {
      return res.status(404).json({ message });
    }
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/setup-intent:
 *   post:
 *     summary: Create a Stripe setup intent
 *     description: Creates a Stripe customer (if customerId is not provided) and a setup intent for collecting an off-session payment method.
 *     tags: [Stripe]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StripeSetupIntentInput'
 *     responses:
 *       201:
 *         description: Setup intent created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StripeSetupIntentResponse'
 *       400:
 *         description: Validation or Stripe error
 *       500:
 *         description: Server error
 */
export async function createSetupIntent(req: Request, res: Response) {
  try {
    const { name, email, customerId } = req.body || {};
    const result = await stripeService.createSetupIntent({ name, email, customerId });
    return res.status(201).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to create setup intent";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/invoices/setup-intent:
 *   post:
 *     summary: Create a Stripe setup intent for an invoice
 *     description: Links the buyer to the invoice, creates a Stripe setup intent, and upserts a local Stripe mandate record.
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StripeInvoiceSetupIntentInput'
 *     responses:
 *       201:
 *         description: Setup intent created for invoice
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StripeInvoiceSetupIntentResponse'
 *       400:
 *         description: Validation or Stripe error
 *       403:
 *         description: Only buyers can perform this action
 *       401:
 *         description: Unauthorized
 */
export async function createInvoiceSetupIntent(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.userType.toUpperCase() !== "BUYER") {
      return res.status(403).json({ message: "Only buyers can create invoice setup intents" });
    }

    const { invoiceId, buyerId: requestedBuyerId } = req.body || {};

    if (!invoiceId) {
      return res.status(400).json({ message: "invoiceId is required" });
    }

    let buyerId = (user as { buyerId?: string }).buyerId;

    if (!buyerId) {
      const buyer = await prisma.buyer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      buyerId = buyer?.id;
    }

    if (!buyerId) {
      return res.status(403).json({ message: "Buyer profile not found for authenticated user" });
    }

    if (requestedBuyerId && requestedBuyerId !== buyerId) {
      return res.status(403).json({ message: "buyerId does not match authenticated buyer" });
    }

    const result = await stripeService.createInvoiceSetupIntent({
      invoiceId,
      buyerId,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to create invoice setup intent";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/create-intent:
 *   post:
 *     summary: Create a one-off payment intent
 *     description: Creates a Stripe PaymentIntent with automatic payment methods enabled and returns its client secret.
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StripePaymentIntentInput'
 *     responses:
 *       201:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StripePaymentIntentResponse'
 *       400:
 *         description: Validation or Stripe error
 *       500:
 *         description: Server error
 */
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { amount, currency, description } = req.body || {};

    if (amount === undefined) {
      return res.status(400).json({ message: "amount is required" });
    }

    const result = await stripeService.createPaymentIntent({
      amount: Number(amount),
      currency,
      description,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to create payment intent";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/mandates/complete:
 *   post:
 *     summary: Complete and store a Stripe mandate
 *     description: Persists the Stripe customer and payment method locally after the client confirms the setup intent.
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StripeCompleteMandateInput'
 *     responses:
 *       201:
 *         description: Mandate stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 mandate:
 *                   $ref: '#/components/schemas/StripeMandateRecord'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
export async function completeMandate(req: Request, res: Response) {
  try {
    const { customerId, paymentMethodId, setupIntentId, signed, name, email } = req.body || {};

    if (!customerId) {
      return res.status(400).json({ message: "customerId is required" });
    }

    const mandate = await stripeService.completeMandate({
      customerId,
      paymentMethodId,
      setupIntentId,
      signed,
      name,
      email,
    });

    return res.status(201).json({ success: true, mandate });
  } catch (error: any) {
    const message = error?.message || "Failed to complete mandate";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/mandates:
 *   get:
 *     summary: List stored Stripe mandates
 *     tags: [Stripe]
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by Stripe customer ID
 *     responses:
 *       200:
 *         description: Mandates retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StripeMandateRecord'
 *       500:
 *         description: Server error
 */
export async function listMandates(req: Request, res: Response) {
  try {
    const customerId = req.query.customerId as string | undefined;
    const mandates = await stripeService.listMandates(customerId);
    return res.status(200).json(mandates);
  } catch (error: any) {
    const message = error?.message || "Failed to list mandates";
    return res.status(500).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/mandates/{mandateId}:
 *   get:
 *     summary: Get a stored Stripe mandate by ID
 *     tags: [Stripe]
 *     parameters:
 *       - in: path
 *         name: mandateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Mandate retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StripeMandateRecord'
 *       404:
 *         description: Mandate not found
 *       500:
 *         description: Server error
 */
export async function getMandate(req: Request, res: Response) {
  try {
    const { mandateId } = req.params;
    const mandate = await stripeService.getMandate(mandateId);
    return res.status(200).json(mandate);
  } catch (error: any) {
    const message = error?.message || "Failed to retrieve mandate";
    if (message === "Mandate not found") {
      return res.status(404).json({ message });
    }
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/setup-intents/{setupIntentId}:
 *   get:
 *     summary: Retrieve a Stripe setup intent
 *     description: Fetches the setup intent from Stripe and returns the resolved payment method ID.
 *     tags: [Stripe]
 *     parameters:
 *       - in: path
 *         name: setupIntentId
 *         required: true
 *         schema:
 *           type: string
 *         example: seti_abc123
 *     responses:
 *       200:
 *         description: Setup intent retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentMethodId:
 *                   type: string
 *                   nullable: true
 *                 setupIntent:
 *                   type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
export async function getSetupIntent(req: Request, res: Response) {
  try {
    const { setupIntentId } = req.params;
    const result = await stripeService.getSetupIntent(setupIntentId);
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to retrieve setup intent";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/mandates/charge:
 *   post:
 *     summary: Charge a stored mandate off-session
 *     description: Creates and confirms a Stripe PaymentIntent using the saved payment method on the mandate.
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StripeChargeMandateInput'
 *     responses:
 *       200:
 *         description: Payment initiated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StripeChargeResponse'
 *       400:
 *         description: Validation or Stripe error
 *       404:
 *         description: Mandate not found
 *       500:
 *         description: Server error
 */
export async function chargeMandate(req: Request, res: Response) {
  try {
    const { mandateId, amount, currency, description } = req.body || {};

    if (!mandateId || amount === undefined) {
      return res.status(400).json({ message: "mandateId and amount are required" });
    }

    const result = await stripeService.chargeMandate({
      mandateId,
      amount: Number(amount),
      currency,
      description,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to charge mandate";
    if (message === "Mandate not found") {
      return res.status(404).json({ message });
    }
    return res.status(400).json({ message });
  }
}

function resolveMerchantId(req: Request, requestedMerchantId?: string) {
  const user = req.user;

  if (!user?.id) {
    return { error: { status: 401, message: "Unauthorized" } };
  }

  if (user.userType.toUpperCase() !== "MERCHANT" && user.userType.toUpperCase() !== "ADMIN") {
    return {
      error: { status: 403, message: "Only merchants can manage Stripe Connect onboarding" },
    };
  }

  const merchantId = requestedMerchantId || user.merchantId;

  if (!merchantId) {
    return { error: { status: 403, message: "Merchant profile not found for authenticated user" } };
  }

  if (
    user.userType.toUpperCase() === "MERCHANT" &&
    requestedMerchantId &&
    user.merchantId &&
    requestedMerchantId !== user.merchantId
  ) {
    return { error: { status: 403, message: "merchantId does not match authenticated merchant" } };
  }

  return { merchantId };
}

/**
 * @openapi
 * /api/v1/stripe/connect/accounts:
 *   post:
 *     summary: Create a Stripe Connect Express account for a merchant
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               merchantId:
 *                 type: string
 *                 format: uuid
 *               country:
 *                 type: string
 *                 example: CA
 *     responses:
 *       201:
 *         description: Connect account created or retrieved
 *       403:
 *         description: Forbidden
 */
export async function createConnectAccount(req: Request, res: Response) {
  try {
    const { merchantId: requestedMerchantId, country } = req.body || {};
    const resolved = resolveMerchantId(req, requestedMerchantId);

    if ("error" in resolved && resolved.error) {
      return res.status(resolved.error.status).json({ message: resolved.error.message });
    }

    const result = await stripeService.createConnectAccount({
      merchantId: resolved.merchantId,
      country,
    });

    return res.status(result.existing ? 200 : 201).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to create Stripe Connect account";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/connect/account-links:
 *   post:
 *     summary: Create a Stripe Connect account onboarding link
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *             properties:
 *               accountId:
 *                 type: string
 *               refreshUrl:
 *                 type: string
 *               returnUrl:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [account_onboarding, account_update]
 *     responses:
 *       201:
 *         description: Account link created
 */
export async function createConnectAccountLink(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { accountId, refreshUrl, returnUrl, type } = req.body || {};

    if (!accountId) {
      return res.status(400).json({ message: "accountId is required" });
    }

    const result = await stripeService.createConnectAccountLink({
      accountId,
      refreshUrl,
      returnUrl,
      type,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to create Stripe Connect account link";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/connect/onboarding:
 *   post:
 *     summary: Create Connect account and return onboarding URL
 *     description: Creates a Stripe Express account for the merchant (if needed) and returns an onboarding link URL.
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               merchantId:
 *                 type: string
 *                 format: uuid
 *               country:
 *                 type: string
 *                 example: CA
 *               refreshUrl:
 *                 type: string
 *               returnUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Onboarding link created
 */
export async function createMerchantConnectOnboarding(req: Request, res: Response) {
  try {
    const { merchantId: requestedMerchantId, country, refreshUrl, returnUrl } = req.body || {};
    const resolved = resolveMerchantId(req, requestedMerchantId);

    if ("error" in resolved && resolved.error) {
      return res.status(resolved.error.status).json({ message: resolved.error.message });
    }

    const result = await stripeService.createMerchantConnectOnboarding({
      merchantId: resolved.merchantId,
      country,
      refreshUrl,
      returnUrl,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to create Stripe Connect onboarding link";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/connect/accounts:
 *   get:
 *     summary: List Stripe Connect accounts
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: startingAfter
 *         schema:
 *           type: string
 *         description: Cursor for pagination (Stripe account ID)
 *     responses:
 *       200:
 *         description: Connect accounts retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function listConnectAccounts(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.userType.toUpperCase() !== "MERCHANT" && user.userType.toUpperCase() !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Only merchants and admins can list Connect accounts" });
    }

    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const startingAfter = req.query.startingAfter as string | undefined;

    const result = await stripeService.listConnectAccounts({
      limit,
      startingAfter,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to list Stripe Connect accounts";
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/connect/accounts/{accountId}:
 *   get:
 *     summary: Get a Stripe Connect account by ID
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         example: acct_abc123
 *     responses:
 *       200:
 *         description: Connect account retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Account not found
 */
export async function getConnectAccount(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.userType.toUpperCase() !== "MERCHANT" && user.userType.toUpperCase() !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Only merchants and admins can view Connect accounts" });
    }

    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({ message: "accountId is required" });
    }

    if (user.userType.toUpperCase() === "MERCHANT" && user.merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: user.merchantId },
        select: { stripeConnectAccountId: true },
      });

      if (merchant?.stripeConnectAccountId !== accountId) {
        return res.status(403).json({ message: "You can only view your own Connect account" });
      }
    }

    const result = await stripeService.getConnectAccount(accountId);
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error?.message || "Failed to retrieve Stripe Connect account";
    if (error?.code === "resource_missing" || error?.statusCode === 404) {
      return res.status(404).json({ message });
    }
    return res.status(400).json({ message });
  }
}

/**
 * @openapi
 * /api/v1/stripe/connect/sync-merchant:
 *   post:
 *     summary: Retrieve Stripe Connect account and sync merchant profile
 *     description: Fetches account details from Stripe and updates the merchant record. details_submitted=true is treated as verified.
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - merchantId
 *               - accountId
 *             properties:
 *               merchantId:
 *                 type: string
 *                 format: uuid
 *               accountId:
 *                 type: string
 *                 example: acct_1Tqr1K213KwDOd5a
 *     responses:
 *       200:
 *         description: Account retrieved and merchant updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Merchant or account not found
 */
export async function syncMerchantConnectAccount(req: Request, res: Response) {
  try {
    const { merchantId: requestedMerchantId, accountId } = req.body || {};

    if (!accountId) {
      return res.status(400).json({ message: "accountId is required" });
    }

    const resolved = resolveMerchantId(req, requestedMerchantId);

    if ("error" in resolved && resolved.error) {
      return res.status(resolved.error.status).json({ message: resolved.error.message });
    }

    if (!resolved.merchantId) {
      return res.status(400).json({ message: "merchantId is required" });
    }

    const result = await stripeService.syncMerchantConnectAccount({
      merchantId: resolved.merchantId,
      accountId,
    });

    return res.status(200).json({
      accountId: result.accountId,
      account: result.account,
      merchant: result.merchant,
      verified: result.verified,
    });
  } catch (error: any) {
    const message = error?.message || "Failed to sync Stripe Connect account";
    if (message === "Merchant not found") {
      return res.status(404).json({ message });
    }
    if (error?.code === "resource_missing" || error?.statusCode === 404) {
      return res.status(404).json({ message });
    }
    return res.status(400).json({ message });
  }
}
