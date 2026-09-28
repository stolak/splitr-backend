import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import {
  merchantReserveContributionController,
  merchantReserveReleaseController,
} from "../controllers/merchantReserveController";

const auth = authenticateJWT;

export const merchantReserveReleaseRoutes = Router();
export const merchantReserveContributionRoutes = Router();

const release = merchantReserveReleaseController;
const contribution = merchantReserveContributionController;

/**
 * @swagger
 * tags:
 *   - name: MerchantReserveRelease
 *     description: Merchant rolling reserve releases
 *   - name: MerchantReserveContribution
 *     description: Merchant rolling reserve contributions
 */

/**
 * @swagger
 * /api/v1/merchant-reserve-releases:
 *   get:
 *     summary: List merchant reserve releases
 *     tags: [MerchantReserveRelease]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: reserveReference
 *         schema:
 *           type: string
 *       - in: query
 *         name: releaseReference
 *         schema:
 *           type: string
 *       - in: query
 *         name: reserveStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED]
 *     responses:
 *       200:
 *         description: Merchant reserve releases retrieved successfully
 *       400:
 *         description: Invalid reserve status
 *   post:
 *     summary: Create a merchant reserve release
 *     tags: [MerchantReserveRelease]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantId, remarks, reserveReference, reserveStatus]
 *             properties:
 *               merchantId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 default: 0
 *                 example: 25.5
 *               remarks:
 *                 type: string
 *               reserveReference:
 *                 type: string
 *                 example: RSV-1001
 *               releaseReference:
 *                 type: string
 *                 nullable: true
 *               reservedDate:
 *                 type: string
 *                 format: date-time
 *               releasedDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               reserveStatus:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED]
 *                 example: PENDING
 *     responses:
 *       201:
 *         description: Merchant reserve release created successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Merchant not found
 */
merchantReserveReleaseRoutes.get("/", auth, release.list.bind(release));
merchantReserveReleaseRoutes.post("/", auth, release.create.bind(release));

/**
 * @swagger
 * /api/v1/merchant-reserve-releases/{id}:
 *   get:
 *     summary: Get a merchant reserve release by id
 *     tags: [MerchantReserveRelease]
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
 *         description: Merchant reserve release retrieved successfully
 *       404:
 *         description: Merchant reserve release not found
 *   put:
 *     summary: Update a merchant reserve release
 *     tags: [MerchantReserveRelease]
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
 *               amount:
 *                 type: number
 *               remarks:
 *                 type: string
 *               reserveReference:
 *                 type: string
 *               releaseReference:
 *                 type: string
 *                 nullable: true
 *               reservedDate:
 *                 type: string
 *                 format: date-time
 *               releasedDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               reserveStatus:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED]
 *     responses:
 *       200:
 *         description: Merchant reserve release updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Merchant reserve release not found
 *   patch:
 *     summary: Partially update a merchant reserve release
 *     tags: [MerchantReserveRelease]
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
 *         description: Merchant reserve release updated successfully
 *   delete:
 *     summary: Delete a merchant reserve release
 *     tags: [MerchantReserveRelease]
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
 *         description: Merchant reserve release deleted successfully
 *       404:
 *         description: Merchant reserve release not found
 */
merchantReserveReleaseRoutes.get("/:id", auth, release.getById.bind(release));
merchantReserveReleaseRoutes.put("/:id", auth, release.update.bind(release));
merchantReserveReleaseRoutes.patch("/:id", auth, release.update.bind(release));
merchantReserveReleaseRoutes.delete("/:id", auth, release.remove.bind(release));

/**
 * @swagger
 * /api/v1/merchant-reserve-contributions:
 *   get:
 *     summary: List merchant reserve contributions
 *     tags: [MerchantReserveContribution]
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
 *         name: reserveStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED]
 *     responses:
 *       200:
 *         description: Merchant reserve contributions retrieved successfully
 *       400:
 *         description: Invalid reserve status
 *   post:
 *     summary: Create a merchant reserve contribution
 *     tags: [MerchantReserveContribution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantId, remarks, batchReference, reserveStatus]
 *             properties:
 *               merchantId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 default: 0
 *                 example: 10
 *               remarks:
 *                 type: string
 *               batchReference:
 *                 type: string
 *                 example: B-1001
 *               contributionDate:
 *                 type: string
 *                 format: date-time
 *               reserveStatus:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED]
 *                 example: PENDING
 *     responses:
 *       201:
 *         description: Merchant reserve contribution created successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Merchant not found
 */
merchantReserveContributionRoutes.get("/", auth, contribution.list.bind(contribution));
merchantReserveContributionRoutes.post("/", auth, contribution.create.bind(contribution));

/**
 * @swagger
 * /api/v1/merchant-reserve-contributions/{id}:
 *   get:
 *     summary: Get a merchant reserve contribution by id
 *     tags: [MerchantReserveContribution]
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
 *         description: Merchant reserve contribution retrieved successfully
 *       404:
 *         description: Merchant reserve contribution not found
 *   put:
 *     summary: Update a merchant reserve contribution
 *     tags: [MerchantReserveContribution]
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
 *               amount:
 *                 type: number
 *               remarks:
 *                 type: string
 *               batchReference:
 *                 type: string
 *               contributionDate:
 *                 type: string
 *                 format: date-time
 *               reserveStatus:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED]
 *     responses:
 *       200:
 *         description: Merchant reserve contribution updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Merchant reserve contribution not found
 *   patch:
 *     summary: Partially update a merchant reserve contribution
 *     tags: [MerchantReserveContribution]
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
 *         description: Merchant reserve contribution updated successfully
 *   delete:
 *     summary: Delete a merchant reserve contribution
 *     tags: [MerchantReserveContribution]
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
 *         description: Merchant reserve contribution deleted successfully
 *       404:
 *         description: Merchant reserve contribution not found
 */
merchantReserveContributionRoutes.get("/:id", auth, contribution.getById.bind(contribution));
merchantReserveContributionRoutes.put("/:id", auth, contribution.update.bind(contribution));
merchantReserveContributionRoutes.patch("/:id", auth, contribution.update.bind(contribution));
merchantReserveContributionRoutes.delete("/:id", auth, contribution.remove.bind(contribution));
