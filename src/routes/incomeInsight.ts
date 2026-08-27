import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { incomeInsightController } from "../controllers/incomeInsightController";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Income Insights
 *     description: Buyer open-banking / income insight metrics
 */

/**
 * @swagger
 * /api/v1/income-insights:
 *   post:
 *     summary: Create income insight
 *     tags: [Income Insights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [buyerId]
 *             properties:
 *               buyerId:
 *                 type: string
 *               monthlyIncome:
 *                 type: number
 *                 example: 6500
 *               incomeStabilityVariance:
 *                 type: number
 *                 example: 12
 *               netCashFlowPercentage:
 *                 type: number
 *                 example: 28
 *               liquidityMonths:
 *                 type: number
 *                 example: 3
 *               nsfEvents:
 *                 type: integer
 *                 example: 0
 *               overdraftFrequency:
 *                 type: integer
 *                 example: 1
 *               loanBurdenPercentage:
 *                 type: number
 *                 example: 15
 *               rawInsight:
 *                 type: object
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 */
router.post(
  "/",
  authenticateJWT,
  incomeInsightController.create.bind(incomeInsightController)
);

/**
 * @swagger
 * /api/v1/income-insights:
 *   get:
 *     summary: List income insights
 *     tags: [Income Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listed successfully
 */
router.get(
  "/",
  authenticateJWT,
  incomeInsightController.list.bind(incomeInsightController)
);

/**
 * @swagger
 * /api/v1/income-insights/buyer/{buyerId}:
 *   get:
 *     summary: List income insights by buyer
 *     tags: [Income Insights]
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
 *         description: Listed successfully
 *       404:
 *         description: Buyer not found
 */
router.get(
  "/buyer/:buyerId",
  authenticateJWT,
  incomeInsightController.getByBuyerId.bind(incomeInsightController)
);

/**
 * @swagger
 * /api/v1/income-insights/{id}:
 *   get:
 *     summary: Get income insight by ID
 *     tags: [Income Insights]
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
 *         description: Retrieved successfully
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  authenticateJWT,
  incomeInsightController.getById.bind(incomeInsightController)
);

/**
 * @swagger
 * /api/v1/income-insights/{id}:
 *   put:
 *     summary: Update income insight
 *     tags: [Income Insights]
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
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put(
  "/:id",
  authenticateJWT,
  incomeInsightController.update.bind(incomeInsightController)
);

router.patch(
  "/:id",
  authenticateJWT,
  incomeInsightController.update.bind(incomeInsightController)
);

/**
 * @swagger
 * /api/v1/income-insights/{id}:
 *   delete:
 *     summary: Delete income insight
 *     tags: [Income Insights]
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
 *         description: Deleted successfully
 */
router.delete(
  "/:id",
  authenticateJWT,
  incomeInsightController.remove.bind(incomeInsightController)
);

export default router;
