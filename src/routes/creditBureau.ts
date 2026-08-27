import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { creditBureauController } from "../controllers/creditBureauController";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Credit Bureau
 *     description: Buyer credit bureau metrics
 */

/**
 * @swagger
 * /api/v1/credit-bureaus:
 *   post:
 *     summary: Create credit bureau record
 *     tags: [Credit Bureau]
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
 *               creditScore:
 *                 type: integer
 *                 example: 720
 *               utilizationPercentage:
 *                 type: number
 *                 example: 35
 *               delinquencies24Months:
 *                 type: integer
 *                 example: 1
 *               collections:
 *                 type: string
 *                 enum: [NONE, PAID, ACTIVE]
 *                 example: NONE
 *               hardInquiries12Months:
 *                 type: integer
 *                 example: 3
 *               bankruptcy:
 *                 type: string
 *                 enum: [NONE, DISCHARGED_OVER_5_YEARS, ACTIVE_OR_RECENT]
 *                 example: NONE
 *               rawCreditBureau:
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
  creditBureauController.create.bind(creditBureauController)
);

/**
 * @swagger
 * /api/v1/credit-bureaus:
 *   get:
 *     summary: List credit bureau records
 *     tags: [Credit Bureau]
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
  creditBureauController.list.bind(creditBureauController)
);

/**
 * @swagger
 * /api/v1/credit-bureaus/buyer/{buyerId}:
 *   get:
 *     summary: List credit bureau records by buyer
 *     tags: [Credit Bureau]
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
  creditBureauController.getByBuyerId.bind(creditBureauController)
);

/**
 * @swagger
 * /api/v1/credit-bureaus/{id}:
 *   get:
 *     summary: Get credit bureau record by ID
 *     tags: [Credit Bureau]
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
  creditBureauController.getById.bind(creditBureauController)
);

/**
 * @swagger
 * /api/v1/credit-bureaus/{id}:
 *   put:
 *     summary: Update credit bureau record
 *     tags: [Credit Bureau]
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
  creditBureauController.update.bind(creditBureauController)
);

router.patch(
  "/:id",
  authenticateJWT,
  creditBureauController.update.bind(creditBureauController)
);

/**
 * @swagger
 * /api/v1/credit-bureaus/{id}:
 *   delete:
 *     summary: Delete credit bureau record
 *     tags: [Credit Bureau]
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
  creditBureauController.remove.bind(creditBureauController)
);

export default router;
