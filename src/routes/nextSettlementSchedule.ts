import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { nextSettlementScheduleController } from "../controllers/nextSettlementScheduleController";

const router = Router();
const auth = authenticateJWT;
const controller = nextSettlementScheduleController;

/**
 * @swagger
 * tags:
 *   - name: NextSettlementSchedule
 *     description: Singleton next settlement and payout schedule
 */

/**
 * @swagger
 * /api/v1/next-settlement-schedule:
 *   get:
 *     summary: Get the next settlement schedule
 *     tags: [NextSettlementSchedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Next settlement schedule retrieved successfully
 *       404:
 *         description: Next settlement schedule not found
 *   put:
 *     summary: Upsert the next settlement schedule
 *     description: >
 *       Creates the singleton schedule when missing (both dates required).
 *       Updates only the provided fields when it already exists.
 *     tags: [NextSettlementSchedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nextSettlementDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-10-01T00:00:00.000Z
 *               nextPayOutDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-10-02T00:00:00.000Z
 *     responses:
 *       200:
 *         description: Next settlement schedule upserted successfully
 *       400:
 *         description: Validation failed
 */
router.get("/", auth, controller.get.bind(controller));
router.put("/", auth, controller.upsert.bind(controller));
router.post("/", auth, controller.upsert.bind(controller));

export default router;
