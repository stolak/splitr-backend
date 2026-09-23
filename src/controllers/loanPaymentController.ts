import { Request, Response } from "express";
import { loanService } from "../services/loanService";
import { PaymentType } from "@prisma/client";

export const loanPaymentController = {
  async createLoanPayment(req: Request, res: Response) {
    try {
      const {
        loanId,
        credit,
        debit,
        principal,
        interest,
        penalty,
        paymentType,
        transactionReference,
        remarks,
        scheduleId,
      } = req.body;

      if (!loanId || !paymentType || !remarks) {
        return res.status(400).json({
          success: false,
          message: "loanId, paymentType, and remarks are required",
        });
      }

      if (!Object.values(PaymentType).includes(paymentType)) {
        return res.status(400).json({
          success: false,
          message: `paymentType must be one of: ${Object.values(PaymentType).join(", ")}`,
        });
      }

      const result = await loanService.createLoanPayment({
        loanId,
        credit: credit !== undefined ? Number(credit) : 0,
        debit: debit !== undefined ? Number(debit) : 0,
        principal: principal !== undefined ? Number(principal) : undefined,
        interest: interest !== undefined ? Number(interest) : undefined,
        penalty: penalty !== undefined ? Number(penalty) : undefined,
        paymentType,
        transactionReference,
        remarks,
        scheduleId,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
