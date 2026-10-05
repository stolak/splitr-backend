import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { stripeCardholderController } from "../controllers/stripeCardholderController";

const router = Router();
const auth = authenticateJWT;
const controller = stripeCardholderController;

/**
 * @swagger
 * tags:
 *   - name: StripeCardholder
 *     description: Local Stripe Issuing cardholder records linked to a buyer
 */

/**
 * @swagger
 * /api/v1/stripe-cardholders:
 *   get:
 *     summary: List Stripe cardholders
 *     tags: [StripeCardholder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isFake
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Stripe cardholders retrieved successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a Stripe cardholder
 *     tags: [StripeCardholder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [buyerId, cardholderId]
 *             properties:
 *               buyerId:
 *                 type: string
 *               cardholderId:
 *                 type: string
 *                 example: ich_123
 *               isFake:
 *                 type: boolean
 *                 description: Optional. Defaults to false when omitted.
 *                 example: false
 *     responses:
 *       201:
 *         description: Stripe cardholder created successfully
 *       400:
 *         description: Validation failed or duplicate buyer or cardholder id
 *       404:
 *         description: Buyer not found
 */
router.get("/", auth, controller.list.bind(controller));
router.post("/", auth, controller.create.bind(controller));

/**
 * @swagger
 * /api/v1/stripe-cardholders/upsert:
 *   put:
 *     summary: Upsert a Stripe cardholder by buyer
 *     description: Creates the cardholder when the buyer has none, otherwise updates cardholderId.
 *     tags: [StripeCardholder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [buyerId, cardholderId]
 *             properties:
 *               buyerId:
 *                 type: string
 *               cardholderId:
 *                 type: string
 *                 example: ich_123
 *               isFake:
 *                 type: boolean
 *                 description: Optional. Updates the flag only when provided.
 *                 example: false
 *     responses:
 *       200:
 *         description: Stripe cardholder upserted successfully
 *       400:
 *         description: Validation failed or cardholder id already belongs to another buyer
 *       404:
 *         description: Buyer not found
 *   post:
 *     summary: Upsert a Stripe cardholder by buyer
 *     tags: [StripeCardholder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [buyerId, cardholderId]
 *             properties:
 *               buyerId:
 *                 type: string
 *               cardholderId:
 *                 type: string
 *                 example: ich_123
 *               isFake:
 *                 type: boolean
 *                 description: Optional. Updates the flag only when provided.
 *                 example: false
 *     responses:
 *       200:
 *         description: Stripe cardholder upserted successfully
 *       400:
 *         description: Validation failed or cardholder id already belongs to another buyer
 *       404:
 *         description: Buyer not found
 */
router.put("/upsert", auth, controller.upsert.bind(controller));
router.post("/upsert", auth, controller.upsert.bind(controller));

/**
 * @swagger
 * /api/v1/stripe-cardholders/buyer/{buyerId}:
 *   get:
 *     summary: Get a Stripe cardholder by buyer
 *     tags: [StripeCardholder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stripe cardholder retrieved successfully
 *       404:
 *         description: Stripe cardholder not found
 */
router.get("/buyer/:buyerId", auth, controller.getByBuyerId.bind(controller));

/**
 * @swagger
 * /api/v1/stripe-cardholders/{id}:
 *   get:
 *     summary: Get a Stripe cardholder by id
 *     tags: [StripeCardholder]
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
 *         description: Stripe cardholder retrieved successfully
 *       404:
 *         description: Stripe cardholder not found
 *   put:
 *     summary: Update a Stripe cardholder
 *     tags: [StripeCardholder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               buyerId:
 *                 type: string
 *               cardholderId:
 *                 type: string
 *                 example: ich_123
 *               isFake:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Stripe cardholder updated successfully
 *       400:
 *         description: Validation failed or duplicate buyer or cardholder id
 *       404:
 *         description: Stripe cardholder or buyer not found
 *   patch:
 *     summary: Partially update a Stripe cardholder
 *     tags: [StripeCardholder]
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
 *         description: Stripe cardholder updated successfully
 *   delete:
 *     summary: Delete a Stripe cardholder
 *     tags: [StripeCardholder]
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
 *         description: Stripe cardholder deleted successfully
 *       404:
 *         description: Stripe cardholder not found
 */
router.get("/:id", auth, controller.getById.bind(controller));
router.put("/:id", auth, controller.update.bind(controller));
router.patch("/:id", auth, controller.update.bind(controller));
router.delete("/:id", auth, controller.remove.bind(controller));

export default router;
