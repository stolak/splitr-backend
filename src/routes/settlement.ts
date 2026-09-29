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
 *           enum: [gross, merchantFees, Tax, Refund, Dispute, Adjustment, ReserveRelease, ReserveContribution]
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
 *                 enum: [gross, merchantFees, Tax, Refund, Dispute, Adjustment, ReserveRelease, ReserveContribution]
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
 * /api/v1/settlements/settled:
 *   get:
 *     summary: List settled settlements grouped by settlementReference
 *     description: >
 *       Returns settlements where isSettled is true and settledDate is within the given range,
 *       grouped by settlementReference.
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Settled settlements retrieved successfully
 *       400:
 *         description: Invalid or missing date range
 */
router.get("/settled", auth, controller.listSettledGrouped.bind(controller));

/**
 * @swagger
 * /api/v1/settlements/merchant-dashboard:
 *   get:
 *     summary: Merchant settlement dashboard
 *     description: >
 *       Returns merchant transactions, reserve releases, pending settlements,
 *       next payout items, and settled groups for a merchant.
 *       When startDate/endDate are omitted, defaults to the last 7 days through tomorrow.
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Merchant settlement dashboard retrieved successfully
 *       400:
 *         description: Validation failed
 */
router.get(
  "/merchant-dashboard",
  auth,
  controller.merchantSettlementDashboard.bind(controller)
);

/**
 * @swagger
 * /api/v1/settlements/pending:
 *   get:
 *     summary: Compute a merchant's pending settlement by product
 *     description: >
 *       Testing endpoint. No authentication.
 *       Groups unsettled completed invoice credits by product and sums credit times chargeRate.
 *     tags: [Settlement]
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pending settlement totals by product configuration
 *       400:
 *         description: merchantId is required
 *       404:
 *         description: Merchant or merchant fee not found
 */
router.get("/pending", controller.computePendingSettlement.bind(controller));

/**
 * @swagger
 * /api/v1/settlements/unsettled-balance:
 *   get:
 *     summary: Get a merchant's unsettled settlement balance
 *     description: Returns sum(credit - debit) for settlements where isSettled is false.
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unsettled balance retrieved successfully
 *       400:
 *         description: merchantId is required
 */
router.get("/unsettled-balance", auth, controller.getUnsettledBalance.bind(controller));

/**
 * @swagger
 * /api/v1/settlements/instant:
 *   post:
 *     summary: Run instant settlement for a merchant
 *     description: >
 *       Computes pending settlement, then applies instant payout charges and withholdings
 *       against the unsettled balance.
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantId]
 *             properties:
 *               merchantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Instant settlement completed successfully
 *       400:
 *         description: merchantId is required
 *       404:
 *         description: Merchant not found
 */
router.post("/instant", auth, controller.instantSettlement.bind(controller));

/**
 * @swagger
 * /api/v1/settlements/batch/{batchReference}:
 *   delete:
 *     summary: Delete settlements by batch reference
 *     description: Deletes every settlement row that matches the given batchReference.
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchReference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Settlements deleted successfully
 *       400:
 *         description: batchReference is required
 *       404:
 *         description: Settlement not found
 */
router.delete(
  "/batch/:batchReference",
  auth,
  controller.removeByBatchReference.bind(controller)
);

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
 *                 enum: [gross, merchantFees, Tax, Refund, Dispute, Adjustment, ReserveRelease, ReserveContribution]
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
