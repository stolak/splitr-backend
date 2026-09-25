import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { taxMatrixController } from "../controllers/taxMatrixController";

const router = Router();
const auth = authenticateJWT;
const controller = taxMatrixController;

/**
 * @swagger
 * tags:
 *   - name: TaxMatrix
 *     description: Provincial GST and PSR tax rates
 */

/**
 * @swagger
 * /api/v1/tax-matrices:
 *   get:
 *     summary: List tax matrices
 *     tags: [TaxMatrix]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tax matrices retrieved successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a tax matrix
 *     tags: [TaxMatrix]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [provinceCode, province, gstRate, psrRate]
 *             properties:
 *               provinceCode:
 *                 type: string
 *                 example: ON
 *               province:
 *                 type: string
 *                 example: Ontario
 *               gstRate:
 *                 type: number
 *                 example: 5
 *               psrRate:
 *                 type: number
 *                 example: 8
 *     responses:
 *       201:
 *         description: Tax matrix created successfully
 *       400:
 *         description: Validation failed or duplicate province code
 */
router.get("/", auth, controller.list.bind(controller));
router.post("/", auth, controller.create.bind(controller));

/**
 * @swagger
 * /api/v1/tax-matrices/province/{provinceCode}:
 *   get:
 *     summary: Get a tax matrix by province code
 *     tags: [TaxMatrix]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provinceCode
 *         required: true
 *         schema:
 *           type: string
 *         example: ON
 *     responses:
 *       200:
 *         description: Tax matrix retrieved successfully
 *       404:
 *         description: Tax matrix not found
 */
router.get("/province/:provinceCode", auth, controller.getByProvinceCode.bind(controller));

/**
 * @swagger
 * /api/v1/tax-matrices/{id}:
 *   get:
 *     summary: Get a tax matrix by id
 *     tags: [TaxMatrix]
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
 *         description: Tax matrix retrieved successfully
 *       404:
 *         description: Tax matrix not found
 *   put:
 *     summary: Update a tax matrix
 *     tags: [TaxMatrix]
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
 *               provinceCode:
 *                 type: string
 *               province:
 *                 type: string
 *               gstRate:
 *                 type: number
 *               psrRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Tax matrix updated successfully
 *       400:
 *         description: Validation failed or duplicate province code
 *       404:
 *         description: Tax matrix not found
 *   patch:
 *     summary: Partially update a tax matrix
 *     tags: [TaxMatrix]
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
 *         description: Tax matrix updated successfully
 *   delete:
 *     summary: Delete a tax matrix
 *     tags: [TaxMatrix]
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
 *         description: Tax matrix deleted successfully
 *       404:
 *         description: Tax matrix not found
 */
router.get("/:id", auth, controller.getById.bind(controller));
router.put("/:id", auth, controller.update.bind(controller));
router.patch("/:id", auth, controller.update.bind(controller));
router.delete("/:id", auth, controller.remove.bind(controller));

export default router;
