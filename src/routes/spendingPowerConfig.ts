import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { spendingPowerConfigController } from "../controllers/spendingPowerConfigController";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Spending Power Config
 *     description: Affordability, risk/behaviour tiers, and maximum exposure settings
 */

/**
 * @swagger
 * /api/v1/spending-power-config:
 *   get:
 *     summary: Get spending power config with risk and behaviour tiers
 *     tags: [Spending Power Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: configId
 *         schema:
 *           type: string
 *           default: default
 *     responses:
 *       200:
 *         description: Config retrieved successfully
 *       404:
 *         description: Config not found
 */
router.get("/", authenticateJWT, spendingPowerConfigController.get.bind(spendingPowerConfigController));

/**
 * @swagger
 * /api/v1/spending-power-config:
 *   post:
 *     summary: Upsert spending power config (allocationPercentage, maximumExposure)
 *     tags: [Spending Power Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allocationPercentage:
 *                 type: number
 *                 example: 0.3
 *               maximumExposure:
 *                 type: number
 *                 example: 500000
 *     responses:
 *       200:
 *         description: Config upserted successfully
 *       400:
 *         description: Bad request
 */
router.post("/", authenticateJWT, spendingPowerConfigController.upsert.bind(spendingPowerConfigController));

/**
 * @swagger
 * /api/v1/spending-power-config:
 *   put:
 *     summary: Update spending power config
 *     tags: [Spending Power Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allocationPercentage:
 *                 type: number
 *               maximumExposure:
 *                 type: number
 *     responses:
 *       200:
 *         description: Config updated successfully
 */
router.put("/", authenticateJWT, spendingPowerConfigController.upsert.bind(spendingPowerConfigController));

/**
 * @swagger
 * /api/v1/spending-power-config:
 *   delete:
 *     summary: Delete spending power config (cascades tiers)
 *     tags: [Spending Power Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: configId
 *         schema:
 *           type: string
 *           default: default
 *     responses:
 *       200:
 *         description: Config deleted successfully
 *       404:
 *         description: Config not found
 */
router.delete("/", authenticateJWT, spendingPowerConfigController.remove.bind(spendingPowerConfigController));

/**
 * @swagger
 * /api/v1/spending-power-config/risk-tiers:
 *   get:
 *     summary: List risk adjustment tiers
 *     tags: [Spending Power Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: configId
 *         schema:
 *           type: string
 *           default: default
 *     responses:
 *       200:
 *         description: Risk tiers listed successfully
 */
router.get(
  "/risk-tiers",
  authenticateJWT,
  spendingPowerConfigController.listRiskTiers.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/risk-tiers:
 *   post:
 *     summary: Create a risk adjustment tier
 *     tags: [Spending Power Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [minScore, maxScore, riskTier, multiplier, maximumExposureCap, treatment]
 *             properties:
 *               configId:
 *                 type: string
 *                 example: default
 *               minScore:
 *                 type: integer
 *                 example: 90
 *               maxScore:
 *                 type: integer
 *                 example: 100
 *               riskTier:
 *                 type: string
 *                 example: A+
 *               multiplier:
 *                 type: number
 *                 example: 1.5
 *               maximumExposureCap:
 *                 type: number
 *                 example: 7500
 *               treatment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Risk tier created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/risk-tiers",
  authenticateJWT,
  spendingPowerConfigController.createRiskTier.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/risk-tiers/{id}:
 *   get:
 *     summary: Get risk tier by ID
 *     tags: [Spending Power Config]
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
 *         description: Risk tier retrieved successfully
 *       404:
 *         description: Risk tier not found
 */
router.get(
  "/risk-tiers/:id",
  authenticateJWT,
  spendingPowerConfigController.getRiskTier.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/risk-tiers/{id}:
 *   put:
 *     summary: Update risk tier
 *     tags: [Spending Power Config]
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
 *               minScore:
 *                 type: integer
 *               maxScore:
 *                 type: integer
 *               riskTier:
 *                 type: string
 *               multiplier:
 *                 type: number
 *               maximumExposureCap:
 *                 type: number
 *               treatment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Risk tier updated successfully
 */
router.put(
  "/risk-tiers/:id",
  authenticateJWT,
  spendingPowerConfigController.updateRiskTier.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/risk-tiers/{id}:
 *   patch:
 *     summary: Partially update risk tier
 *     tags: [Spending Power Config]
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
 *         description: Risk tier updated successfully
 */
router.patch(
  "/risk-tiers/:id",
  authenticateJWT,
  spendingPowerConfigController.updateRiskTier.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/risk-tiers/{id}:
 *   delete:
 *     summary: Delete risk tier
 *     tags: [Spending Power Config]
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
 *         description: Risk tier deleted successfully
 */
router.delete(
  "/risk-tiers/:id",
  authenticateJWT,
  spendingPowerConfigController.deleteRiskTier.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/behaviour-tiers:
 *   get:
 *     summary: List behavioural adjustment tiers
 *     tags: [Spending Power Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: configId
 *         schema:
 *           type: string
 *           default: default
 *     responses:
 *       200:
 *         description: Behaviour tiers listed successfully
 */
router.get(
  "/behaviour-tiers",
  authenticateJWT,
  spendingPowerConfigController.listBehaviourTiers.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/behaviour-tiers:
 *   post:
 *     summary: Create a behavioural adjustment tier
 *     tags: [Spending Power Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [minScore, maxScore, behaviourTier, multiplier, treatment]
 *             properties:
 *               configId:
 *                 type: string
 *                 example: default
 *               minScore:
 *                 type: integer
 *                 example: 90
 *               maxScore:
 *                 type: integer
 *                 example: 100
 *               behaviourTier:
 *                 type: string
 *                 example: A+
 *               multiplier:
 *                 type: number
 *                 example: 1.5
 *               treatment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Behaviour tier created successfully
 */
router.post(
  "/behaviour-tiers",
  authenticateJWT,
  spendingPowerConfigController.createBehaviourTier.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/behaviour-tiers/{id}:
 *   get:
 *     summary: Get behaviour tier by ID
 *     tags: [Spending Power Config]
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
 *         description: Behaviour tier retrieved successfully
 *       404:
 *         description: Behaviour tier not found
 */
router.get(
  "/behaviour-tiers/:id",
  authenticateJWT,
  spendingPowerConfigController.getBehaviourTier.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/behaviour-tiers/{id}:
 *   put:
 *     summary: Update behaviour tier
 *     tags: [Spending Power Config]
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
 *               minScore:
 *                 type: integer
 *               maxScore:
 *                 type: integer
 *               behaviourTier:
 *                 type: string
 *               multiplier:
 *                 type: number
 *               treatment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Behaviour tier updated successfully
 */
router.put(
  "/behaviour-tiers/:id",
  authenticateJWT,
  spendingPowerConfigController.updateBehaviourTier.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/behaviour-tiers/{id}:
 *   patch:
 *     summary: Partially update behaviour tier
 *     tags: [Spending Power Config]
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
 *         description: Behaviour tier updated successfully
 */
router.patch(
  "/behaviour-tiers/:id",
  authenticateJWT,
  spendingPowerConfigController.updateBehaviourTier.bind(spendingPowerConfigController)
);

/**
 * @swagger
 * /api/v1/spending-power-config/behaviour-tiers/{id}:
 *   delete:
 *     summary: Delete behaviour tier
 *     tags: [Spending Power Config]
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
 *         description: Behaviour tier deleted successfully
 */
router.delete(
  "/behaviour-tiers/:id",
  authenticateJWT,
  spendingPowerConfigController.deleteBehaviourTier.bind(spendingPowerConfigController)
);

export default router;
