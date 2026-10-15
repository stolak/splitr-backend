import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalActiveBuyers:
 *                       type: number
 *                       description: Total number of active buyers
 *                       example: 1250
 *                     totalActiveMerchants:
 *                       type: number
 *                       description: Total number of active merchants
 *                       example: 89
 *                     totalActiveUsers:
 *                       type: number
 *                       description: Total number of active users (buyers + merchants)
 *                       example: 1339
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when the statistics were generated
 *                       example: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Internal server error
 */
router.get("/stats", authenticateJWT, dashboardController.getDashboardStats);

/**
 * @swagger
 * /api/v1/dashboard/buyer:
 *   get:
 *     summary: Buyer financing dashboard
 *     description: >
 *       Returns the signed-in buyer's spending power, outstanding financing,
 *       next payment, payments due in the next 30 days, and plan list.
 *       Admins must pass buyerId.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: Required for admins. Ignored for buyers.
 *     responses:
 *       200:
 *         description: Buyer dashboard retrieved successfully
 *       400:
 *         description: buyerId is required for admins
 *       403:
 *         description: Buyer access is required
 *       404:
 *         description: Buyer not found
 */
router.get("/buyer", authenticateJWT, dashboardController.getBuyerDashboard);

/**
 * @swagger
 * /api/v1/dashboard/merchant:
 *   get:
 *     summary: Merchant portal dashboard
 *     description: >
 *       Returns GMV, successful purchases, financing approval rate, average purchase value,
 *       the six-month GMV chart, attention counts, settlement snapshot, category and product
 *       mix, customer insights, and recent purchases. Financing amount and financing status
 *       are omitted from the transaction list. merchantId is required. outletId limits the
 *       figures to one outlet. When startDate and endDate are omitted, the range is the
 *       month ending today.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: outletId
 *         schema:
 *           type: string
 *         description: Optional outlet. Omit for all outlets.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Merchant dashboard retrieved successfully
 *       400:
 *         description: merchantId or the date range is invalid
 *       403:
 *         description: Merchant access is required
 *       404:
 *         description: Merchant or outlet not found
 */
router.get("/merchant", authenticateJWT, dashboardController.getMerchantDashboard);

export default router;
