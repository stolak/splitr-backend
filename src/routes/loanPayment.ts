import { Router } from "express";
import { loanPaymentController } from "../controllers/loanPaymentController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: LoanPayments
 *   description: Loan payment management endpoints
 */

/**
 * @swagger
 * /api/v1/loan-payments:
 *   post:
 *     summary: Create a loan payment
 *     tags: [LoanPayments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loanId
 *               - paymentType
 *               - remarks
 *             properties:
 *               loanId:
 *                 type: string
 *               credit:
 *                 type: number
 *                 default: 0
 *               debit:
 *                 type: number
 *                 default: 0
 *               principal:
 *                 type: number
 *               interest:
 *                 type: number
 *               penalty:
 *                 type: number
 *               paymentType:
 *                 type: string
 *                 enum: [full, partial, early, late, instant]
 *               transactionReference:
 *                 type: string
 *               remarks:
 *                 type: string
 *               scheduleId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Loan payment created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, loanPaymentController.createLoanPayment);

export default router;
