import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { invoiceCategoryController } from "../controllers/invoiceCategoryController";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Invoice Categories
 *     description: Invoice category management with risk/pricing multipliers
 */

/**
 * @swagger
 * /api/v1/invoice-categories:
 *   get:
 *     summary: List all invoice categories
 *     description: >
 *       Returns every invoice category. Results are served from an in-memory cache
 *       for 30 minutes; the cache is cleared on create, update, or delete.
 *     tags: [Invoice Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoice categories retrieved successfully
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
 *                       name:
 *                         type: string
 *                         example: Electronics
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       multiplier:
 *                         type: number
 *                         example: 1.15
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authenticateJWT,
  invoiceCategoryController.list.bind(invoiceCategoryController)
);

/**
 * @swagger
 * /api/v1/invoice-categories:
 *   post:
 *     summary: Create an invoice category
 *     tags: [Invoice Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, multiplier]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: Consumer electronics and gadgets
 *               multiplier:
 *                 type: number
 *                 example: 1.15
 *     responses:
 *       201:
 *         description: Invoice category created successfully
 *       400:
 *         description: Validation failed or duplicate name
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authenticateJWT,
  invoiceCategoryController.create.bind(invoiceCategoryController)
);

/**
 * @swagger
 * /api/v1/invoice-categories/name/{name}:
 *   get:
 *     summary: Get an invoice category by name
 *     description: Resolved from the cached category list.
 *     tags: [Invoice Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         example: Electronics
 *     responses:
 *       200:
 *         description: Invoice category retrieved successfully
 *       404:
 *         description: Invoice category not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/name/:name",
  authenticateJWT,
  invoiceCategoryController.getByName.bind(invoiceCategoryController)
);

/**
 * @swagger
 * /api/v1/invoice-categories/{id}:
 *   get:
 *     summary: Get an invoice category by ID
 *     description: Resolved from the cached category list.
 *     tags: [Invoice Categories]
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
 *         description: Invoice category retrieved successfully
 *       404:
 *         description: Invoice category not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:id",
  authenticateJWT,
  invoiceCategoryController.getById.bind(invoiceCategoryController)
);

/**
 * @swagger
 * /api/v1/invoice-categories/{id}:
 *   put:
 *     summary: Update an invoice category
 *     tags: [Invoice Categories]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               multiplier:
 *                 type: number
 *     responses:
 *       200:
 *         description: Invoice category updated successfully
 *       400:
 *         description: Validation failed or duplicate name
 *       404:
 *         description: Invoice category not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authenticateJWT,
  invoiceCategoryController.update.bind(invoiceCategoryController)
);

/**
 * @swagger
 * /api/v1/invoice-categories/{id}:
 *   patch:
 *     summary: Partially update an invoice category
 *     tags: [Invoice Categories]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               multiplier:
 *                 type: number
 *     responses:
 *       200:
 *         description: Invoice category updated successfully
 *       400:
 *         description: Validation failed or duplicate name
 *       404:
 *         description: Invoice category not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id",
  authenticateJWT,
  invoiceCategoryController.update.bind(invoiceCategoryController)
);

/**
 * @swagger
 * /api/v1/invoice-categories/{id}:
 *   delete:
 *     summary: Delete an invoice category
 *     tags: [Invoice Categories]
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
 *         description: Invoice category deleted successfully
 *       404:
 *         description: Invoice category not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  authenticateJWT,
  invoiceCategoryController.remove.bind(invoiceCategoryController)
);

export default router;
