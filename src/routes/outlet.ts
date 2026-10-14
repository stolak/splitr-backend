import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { outletController } from "../controllers/outletController";

const router = Router();
const auth = authenticateJWT;
const controller = outletController;

/**
 * @swagger
 * tags:
 *   - name: Outlet
 *     description: Merchant outlets
 */

/**
 * @swagger
 * /api/v1/outlets:
 *   get:
 *     summary: List outlets
 *     tags: [Outlet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Outlets retrieved successfully
 *   post:
 *     summary: Create an outlet
 *     tags: [Outlet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantId, outletName]
 *             properties:
 *               merchantId:
 *                 type: string
 *               outletName:
 *                 type: string
 *               code:
 *                 type: string
 *               outletAddress:
 *                 type: string
 *               provinceCode:
 *                 type: string
 *                 example: ON
 *                 description: Tax matrix province code. Omit to leave unset.
 *               outletPhone:
 *                 type: string
 *               outletEmail:
 *                 type: string
 *               outletMerchantBankAccountId:
 *                 type: string
 *                 description: Merchant bank account for this outlet. It must belong to merchantId.
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Pending, Suspended, Closed]
 *               type:
 *                 type: string
 *                 enum: [HeadOffice, Branch, Franchise, MobileStore, OnlineStore, Other]
 *               userManagerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Outlet created successfully
 *       400:
 *         description: Validation failed
 */
router.get("/", auth, controller.list.bind(controller));
router.post("/", auth, controller.create.bind(controller));

/**
 * @swagger
 * /api/v1/outlets/merchant/{merchantId}:
 *   get:
 *     summary: List outlets for a merchant
 *     tags: [Outlet]
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
 *         description: Outlets retrieved successfully
 */
router.get("/merchant/:merchantId", auth, controller.listByMerchant.bind(controller));

/**
 * @swagger
 * /api/v1/outlets/{id}:
 *   get:
 *     summary: Get an outlet
 *     tags: [Outlet]
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
 *         description: Outlet retrieved successfully
 *       404:
 *         description: Outlet not found
 *   put:
 *     summary: Update an outlet
 *     tags: [Outlet]
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
 *               outletName:
 *                 type: string
 *               code:
 *                 type: string
 *                 nullable: true
 *               outletAddress:
 *                 type: string
 *                 nullable: true
 *               provinceCode:
 *                 type: string
 *                 nullable: true
 *                 example: ON
 *                 description: Tax matrix province code. Pass null to clear it.
 *               outletPhone:
 *                 type: string
 *                 nullable: true
 *               outletEmail:
 *                 type: string
 *                 nullable: true
 *               outletMerchantBankAccountId:
 *                 type: string
 *                 nullable: true
 *                 description: Merchant bank account for this outlet. Pass null to clear it. It must belong to the outlet merchant.
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Pending, Suspended, Closed]
 *               type:
 *                 type: string
 *                 enum: [HeadOffice, Branch, Franchise, MobileStore, OnlineStore, Other]
 *               merchantId:
 *                 type: string
 *               userManagerId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Outlet updated successfully
 *   patch:
 *     summary: Partially update an outlet
 *     tags: [Outlet]
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
 *         description: Outlet updated successfully
 *   delete:
 *     summary: Delete an outlet
 *     tags: [Outlet]
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
 *         description: Outlet deleted successfully
 */
router.get("/:id", auth, controller.getById.bind(controller));
router.put("/:id", auth, controller.update.bind(controller));
router.patch("/:id", auth, controller.update.bind(controller));
router.delete("/:id", auth, controller.remove.bind(controller));

export default router;
