import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { merchantBankAccountController } from "../controllers/merchantBankAccountController";

const router = Router();
const auth = authenticateJWT;
const controller = merchantBankAccountController;

/**
 * @swagger
 * tags:
 *   - name: MerchantBankAccount
 *     description: Merchant bank accounts synced from Stripe external accounts
 */

/**
 * @swagger
 * /api/v1/merchant-bank-accounts:
 *   get:
 *     summary: List merchant bank accounts
 *     tags: [MerchantBankAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Merchant bank accounts retrieved successfully
 *   post:
 *     summary: Create a merchant bank account
 *     tags: [MerchantBankAccount]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantId, bankAccountId, bankName]
 *             properties:
 *               merchantId:
 *                 type: string
 *               bankAccountId:
 *                 type: string
 *                 example: ba_123
 *               bankName:
 *                 type: string
 *               last4:
 *                 type: string
 *               accountHolderName:
 *                 type: string
 *               routingNumber:
 *                 type: string
 *               accountType:
 *                 type: string
 *               accountName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Merchant bank account created successfully
 *       400:
 *         description: Validation failed
 */
router.get("/", auth, controller.list.bind(controller));
router.post("/", auth, controller.create.bind(controller));

/**
 * @swagger
 * /api/v1/merchant-bank-accounts/merchant/{merchantId}:
 *   get:
 *     summary: List bank accounts for a merchant
 *     tags: [MerchantBankAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Merchant bank accounts retrieved successfully
 */
router.get("/merchant/:merchantId", auth, controller.listByMerchant.bind(controller));

/**
 * @swagger
 * /api/v1/merchant-bank-accounts/{id}:
 *   get:
 *     summary: Get a merchant bank account
 *     tags: [MerchantBankAccount]
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
 *         description: Merchant bank account retrieved successfully
 *       404:
 *         description: Merchant bank account not found
 *   put:
 *     summary: Update a merchant bank account
 *     tags: [MerchantBankAccount]
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
 *         description: Merchant bank account updated successfully
 *   patch:
 *     summary: Partially update a merchant bank account
 *     tags: [MerchantBankAccount]
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
 *         description: Merchant bank account updated successfully
 *   delete:
 *     summary: Delete a merchant bank account
 *     tags: [MerchantBankAccount]
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
 *         description: Merchant bank account deleted successfully
 */
router.get("/:id", auth, controller.getById.bind(controller));
router.put("/:id", auth, controller.update.bind(controller));
router.patch("/:id", auth, controller.update.bind(controller));
router.delete("/:id", auth, controller.remove.bind(controller));

export default router;
