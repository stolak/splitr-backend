import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { settlementController } from "../controllers/settlementController";

const router = Router();
const auth = authenticateJWT;
const controller = settlementController;

/**
 * @swagger
 * tags:
 *   - name: Settlement
 *     description: Merchant settlement ledger entries
 */

/**
 * @swagger
 * /api/v1/settlements:
 *   get:
 *     summary: List settlements
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: batchReference
 *         schema:
 *           type: string
 *       - in: query
 *         name: settlementRecordType
 *         schema:
 *           type: string
 *           enum: [gross, merchantFees, Tax, Refund, DisputDebit, DisputCredit, CreditAdjustment, DebitAdjustment, ReserveRelease, ReserveContribution]
 *     responses:
 *       200:
 *         description: Settlements retrieved successfully
 *       400:
 *         description: Invalid settlement record type
 *   post:
 *     summary: Create a settlement
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantId, remarks, settlementRecordType, batchReference]
 *             properties:
 *               merchantId:
 *                 type: string
 *               debit:
 *                 type: number
 *                 default: 0
 *                 example: 0
 *               credit:
 *                 type: number
 *                 default: 0
 *                 example: 100.5
 *               remarks:
 *                 type: string
 *                 example: Gross settlement for batch B-1001
 *               settlementRecordType:
 *                 type: string
 *                 enum: [gross, merchantFees, Tax, Refund, DisputDebit, DisputCredit, CreditAdjustment, DebitAdjustment, ReserveRelease, ReserveContribution]
 *                 example: gross
 *               batchReference:
 *                 type: string
 *                 example: B-1001
 *     responses:
 *       201:
 *         description: Settlement created successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Merchant not found
 */
router.get("/", auth, controller.list.bind(controller));
router.post("/", auth, controller.create.bind(controller));

/**
 * @swagger
 * /api/v1/settlements/{id}:
 *   get:
 *     summary: Get a settlement by id
 *     tags: [Settlement]
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
 *         description: Settlement retrieved successfully
 *       404:
 *         description: Settlement not found
 *   put:
 *     summary: Update a settlement
 *     tags: [Settlement]
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
 *               merchantId:
 *                 type: string
 *               debit:
 *                 type: number
 *               credit:
 *                 type: number
 *               remarks:
 *                 type: string
 *               settlementRecordType:
 *                 type: string
 *                 enum: [gross, merchantFees, Tax, Refund, DisputDebit, DisputCredit, CreditAdjustment, DebitAdjustment, ReserveRelease, ReserveContribution]
 *               batchReference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settlement updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Settlement not found
 *   patch:
 *     summary: Partially update a settlement
 *     tags: [Settlement]
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
 *         description: Settlement updated successfully
 *   delete:
 *     summary: Delete a settlement
 *     tags: [Settlement]
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
 *         description: Settlement deleted successfully
 *       404:
 *         description: Settlement not found
 */
router.get("/:id", auth, controller.getById.bind(controller));
router.put("/:id", auth, controller.update.bind(controller));
router.patch("/:id", auth, controller.update.bind(controller));
router.delete("/:id", auth, controller.remove.bind(controller));

export default router;
