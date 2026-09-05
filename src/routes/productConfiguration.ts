import { Router } from "express";
import { productConfigurationController } from "../controllers/productConfigurationController";
import { authenticateJWT } from "../middlewares/auth";
const router = Router();

/**
 * @swagger
 * /api/v1/product-configurations:
 *   get:
 *     summary: Get all product configurations
 *     description: >
 *       Returns every configured financing product. Results are served from an in-memory
 *       cache for 30 minutes; the cache is cleared whenever a product configuration is updated.
 *     tags: [Product Configurations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product configurations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       code:
 *                         type: string
 *                         example: MONTHLY_FLEX_6
 *                       productName:
 *                         type: string
 *                         example: Monthly Flex - 6 months
 *                       tenure:
 *                         type: integer
 *                         example: 6
 *                       minimumFinance:
 *                         type: number
 *                         example: 500
 *                       maximumFinance:
 *                         type: number
 *                         example: 7500
 *                       rate:
 *                         type: number
 *                         description: Rate as a percentage, e.g. 2.5 for 2.5%
 *                         example: 12.99
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Internal server error
 */
router.get("/", productConfigurationController.getProductConfigurations);

/**
 * @swagger
 * /api/v1/product-configurations/code/{code}:
 *   get:
 *     summary: Get a product configuration by code
 *     tags: [Product Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: MONTHLY_FLEX_6
 *     responses:
 *       200:
 *         description: Product configuration retrieved successfully
 *       404:
 *         description: Product configuration not found
 *       500:
 *         description: Internal server error
 */
router.get("/code/:code", productConfigurationController.getProductConfigurationByCode);

/**
 * @swagger
 * /api/v1/product-configurations/{id}:
 *   get:
 *     summary: Get a product configuration by id
 *     tags: [Product Configurations]
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
 *         description: Product configuration retrieved successfully
 *       404:
 *         description: Product configuration not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", productConfigurationController.getProductConfigurationById);

/**
 * @swagger
 * /api/v1/product-configurations/{id}:
 *   put:
 *     summary: Update product configuration fields
 *     description: >
 *       Updates only the provided fields and clears the product configuration cache so the
 *       next read reflects the change immediately.
 *     tags: [Product Configurations]
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
 *               code:
 *                 type: string
 *                 description: Unique product code
 *                 example: MONTHLY_FLEX_6
 *               productName:
 *                 type: string
 *                 example: Monthly Flex - 6 months
 *               tenure:
 *                 type: integer
 *                 description: Number of installments or months
 *                 example: 6
 *               minimumFinance:
 *                 type: number
 *                 example: 500
 *               maximumFinance:
 *                 type: number
 *                 example: 7500
 *               rate:
 *                 type: number
 *                 description: Rate as a percentage, e.g. 2.5 for 2.5%
 *                 example: 12.99
 *     responses:
 *       200:
 *         description: Product configuration updated successfully
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Product configuration not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authenticateJWT, productConfigurationController.updateProductConfiguration);

/**
 * @swagger
 * /api/v1/product-configurations/{id}:
 *   patch:
 *     summary: Update product configuration fields (alias of PUT)
 *     tags: [Product Configurations]
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
 *               code:
 *                 type: string
 *               productName:
 *                 type: string
 *               tenure:
 *                 type: integer
 *               minimumFinance:
 *                 type: number
 *               maximumFinance:
 *                 type: number
 *               rate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product configuration updated successfully
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Product configuration not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", authenticateJWT, productConfigurationController.updateProductConfiguration);

export default router;
