import { Request, Response } from "express";
import { TransactionStatus } from "@prisma/client";
import {
  CreateMandateDebitInput,
  mandateDebitService,
  UpdateMandateDebitInput,
} from "../services/mandateDebitService";

/**
 * @swagger
 * /api/v1/mandate-debits:
 *   post:
 *     summary: Create a mandate debit record
 *     tags: [MandateDebit]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMandateDebitInput'
 *     responses:
 *       201:
 *         description: Mandate debit created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Invoice or loan not found
 */
/**
 * @swagger
 * /api/v1/mandate-debits:
 *   get:
 *     summary: List mandate debits
 *     tags: [MandateDebit]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: loanId
 *         schema:
 *           type: string
 *       - in: query
 *         name: mandateId
 *         schema:
 *           type: string
 *       - in: query
 *         name: reference
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Completed, Failed]
 *     responses:
 *       200:
 *         description: List of mandate debits
 */
/**
 * @swagger
 * /api/v1/mandate-debits/{id}:
 *   get:
 *     summary: Get mandate debit by ID
 *     tags: [MandateDebit]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mandate debit found
 *       404:
 *         description: Not found
 */
/**
 * @swagger
 * /api/v1/mandate-debits/mandate/{mandateId}/reference/{reference}:
 *   get:
 *     summary: Get mandate debit by mandateId and reference
 *     tags: [MandateDebit]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: mandateId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mandate debit found
 *       404:
 *         description: Not found
 */
/**
 * @swagger
 * /api/v1/mandate-debits/{id}:
 *   patch:
 *     summary: Update mandate debit by ID
 *     tags: [MandateDebit]
 *     security: []
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
 *             $ref: '#/components/schemas/UpdateMandateDebitInput'
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 */
/**
 * @swagger
 * /api/v1/mandate-debits/{id}:
 *   delete:
 *     summary: Delete mandate debit by ID
 *     tags: [MandateDebit]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateMandateDebitInput:
 *       type: object
 *       required:
 *         - mandateId
 *         - reference
 *         - amount
 *         - transactionDate
 *       properties:
 *         invoiceId:
 *           type: string
 *           nullable: true
 *         loanId:
 *           type: string
 *           nullable: true
 *         mandateId:
 *           type: string
 *         reference:
 *           type: string
 *         amount:
 *           type: number
 *         transactionDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [Pending, Completed, Failed]
 *     UpdateMandateDebitInput:
 *       type: object
 *       properties:
 *         invoiceId:
 *           type: string
 *           nullable: true
 *         loanId:
 *           type: string
 *           nullable: true
 *         mandateId:
 *           type: string
 *         reference:
 *           type: string
 *         amount:
 *           type: number
 *         transactionDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [Pending, Completed, Failed]
 */
export class MandateDebitController {
  async create(req: Request, res: Response) {
    try {
      const input: CreateMandateDebitInput = req.body;
      if (!input?.mandateId || !input?.reference) {
        return res.status(400).json({
          success: false,
          message: "mandateId and reference are required",
        });
      }
      if (typeof input.amount !== "number") {
        return res.status(400).json({
          success: false,
          message: "amount is required and must be a number",
        });
      }
      if (!input.transactionDate) {
        return res.status(400).json({
          success: false,
          message: "transactionDate is required",
        });
      }
      if (
        input.status !== undefined &&
        !Object.values(TransactionStatus).includes(input.status)
      ) {
        return res.status(400).json({
          success: false,
          message: "status must be one of Pending, Completed, Failed",
        });
      }

      const result = await mandateDebitService.create(input);
      return res.status(201).json(result);
    } catch (error: any) {
      const msg = error.message || "Failed to create mandate debit";
      const status = msg.includes("not found") ? 404 : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { invoiceId, loanId, mandateId, reference, status } = req.query as any;
      const statusEnum =
        typeof status === "string" && Object.values(TransactionStatus).includes(status as any)
          ? (status as TransactionStatus)
          : undefined;

      const result = await mandateDebitService.list({
        invoiceId: typeof invoiceId === "string" ? invoiceId : undefined,
        loanId: typeof loanId === "string" ? loanId : undefined,
        mandateId: typeof mandateId === "string" ? mandateId : undefined,
        reference: typeof reference === "string" ? reference : undefined,
        status: statusEnum,
      });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to list mandate debits",
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const result = await mandateDebitService.getById(req.params.id);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message || "Mandate debit not found",
      });
    }
  }

  async getByMandateIdAndReference(req: Request, res: Response) {
    try {
      const { mandateId, reference } = req.params;
      const result = await mandateDebitService.getByMandateIdAndReference(mandateId, reference);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message || "Mandate debit not found",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const input: UpdateMandateDebitInput = req.body;
      if (
        input.status !== undefined &&
        !Object.values(TransactionStatus).includes(input.status)
      ) {
        return res.status(400).json({
          success: false,
          message: "status must be one of Pending, Completed, Failed",
        });
      }
      const result = await mandateDebitService.update(req.params.id, input);
      return res.status(200).json(result);
    } catch (error: any) {
      const msg = error.message || "Failed to update mandate debit";
      const status = msg.includes("not found") ? 404 : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const result = await mandateDebitService.remove(req.params.id);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message || "Mandate debit not found",
      });
    }
  }
}

export const mandateDebitController = new MandateDebitController();

