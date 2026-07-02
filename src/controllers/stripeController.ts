import { Request, Response } from "express";
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
