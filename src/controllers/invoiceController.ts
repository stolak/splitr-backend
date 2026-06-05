import { Request, Response } from 'express';
import { invoiceService, CreateInvoiceInput, UpdateInvoiceInput } from '../services/invoiceService';

import { InvoiceStatus, InvoiceType, LoanReturnStatus } from '@prisma/client';

/**
 * @swagger
 * tags:
 *   name: Invoice
 *   description: Invoice management
 */

/**
 * @swagger
 * /api/v1/invoices:
 *   post:
 *     summary: Create a new invoice with items
 *     tags: [Invoice]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - customerEmail
 *               - customerPhoneNumber
 *               - dueDate
 *               - amount
 *               - merchantId
 *               - items
 *             properties:
 *               customerName:
 *                 type: string
 *                 example: "John Doe"
 *               customerEmail:
 *                 type: string
 *                 example: "john@example.com"
 *               customerPhoneNumber:
 *                 type: string
 *                 example: "+2348012345678"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 150000
 *               buyerId:
 *                 type: string
 *                 description: Optional buyer ID
 *               merchantId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Pending, Paid, Cancelled]
 *                 default: Pending
 *               type:
 *                 type: string
 *                 enum: [Purchase, Ecommerce, Shopping, Services, Invoice]
 *                 default: Purchase
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - description
 *                     - quantity
 *                     - amount
 *                   properties:
 *                     description:
 *                       type: string
 *                       example: "Product A"
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     amount:
 *                       type: number
 *                       example: 50000
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/v1/invoices:
 *   get:
 *     summary: Get all invoices with filters and pagination
 *     tags: [Invoice]
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Cancelled]
 *       - in: query
 *         name: customerEmail
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional search term for splitrId, customerName, customerPhoneNumber, or customerEmail
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Purchase, Ecommerce, Shopping, Services, Invoice]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of invoices with pagination
 */

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoice]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */

/**
 * @swagger
 * /api/v1/invoices/splitr/{splitrId}:
 *   get:
 *     summary: Get invoice by splitr ID
 *     tags: [Invoice]
 *     parameters:
 *       - in: path
 *         name: splitrId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */

/**
 * @swagger
 * /api/v1/invoices/merchant/{merchantId}:
 *   get:
 *     summary: Get all invoices for a merchant
 *     tags: [Invoice]
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Cancelled]
 *     responses:
 *       200:
 *         description: List of merchant invoices
 */

/**
 * @swagger
 * /api/v1/invoices/buyer/{buyerId}:
 *   get:
 *     summary: Get all invoices for a buyer
 *     tags: [Invoice]
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Cancelled]
 *     responses:
 *       200:
 *         description: List of buyer invoices
 */

/**
 * @swagger
 * /api/v1/invoices/my-invoices:
 *   get:
 *     summary: Get all invoices for the authenticated user's email
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Cancelled]
 *     responses:
 *       200:
 *         description: List of user's invoices
 *       401:
 *         description: Unauthorized - User not authenticated
 */

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   patch:
 *     summary: Update invoice (including return workflow fields)
 *     tags: [Invoice]
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
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerPhoneNumber:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 *               amount:
 *                 type: number
 *               buyerId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Pending, Paid, Cancelled]
 *               type:
 *                 type: string
 *                 enum: [Purchase, Ecommerce, Shopping, Services, Invoice]
 *               returnStatus:
 *                 type: string
 *                 enum: [Active, Approved, Rejected, Refunded, Pending]
 *                 description: |
 *                   Loan return status for the invoice. When set to `Pending`,
 *                   `returnInitiatedDate` and `returnInitiatedBy` are auto-populated by the controller.
 *                   When set to `Approved`, `returnApprovedDate` and `returnApprovedBy` are auto-populated.
 *               returnReference:
 *                 type: string
 *               returnReason:
 *                 type: string
 *               returnNote:
 *                 type: string
 *               returnInitiatedDate:
 *                 type: string
 *                 format: date-time
 *               returnDate:
 *                 type: string
 *                 format: date-time
 *                 description: Deprecated alias for returnInitiatedDate
 *               returnApprovedBy:
 *                 type: string
 *               returnApprovedDate:
 *                 type: string
 *                 format: date-time
 *               returnInitiatedBy:
 *                 type: string
 *               items:
 *                 type: array
 *                 description: If provided, existing invoice items are replaced with this list
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     amount:
 *                       type: number
 *     responses:
 *       200:
 *         description: Invoice updated
 *       400:
 *         description: Invalid request (e.g. invoice or buyer not found)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/invoices/{id}/status:
 *   patch:
 *     summary: Update invoice status
 *     tags: [Invoice]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Paid, Cancelled]
 *     responses:
 *       200:
 *         description: Invoice status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Invoice not found
 */

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   delete:
 *     summary: Delete invoice
 *     tags: [Invoice]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice deleted
 *       404:
 *         description: Invoice not found
 */

/**
 * @swagger
 * /api/v1/invoices/{id}/total:
 *   get:
 *     summary: Calculate invoice total from items
 *     tags: [Invoice]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice total calculated
 */

/**
 * @swagger
 * /api/v1/invoices/merchant/{merchantId}/stats:
 *   get:
 *     summary: Get merchant invoice statistics
 *     tags: [Invoice]
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice statistics
 */

/**
 * @swagger
 * /api/v1/invoices/{id}/approve-and-create-loan:
 *   post:
 *     summary: Approve invoice and create loan for authenticated buyer
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loanTenure
 *               - downPaymentAmount
 *             properties:
 *               loanTenure:
 *                 type: number
 *                 description: Number of months for loan repayment
 *                 example: 12
 *               downPaymentAmount:
 *                 type: number
 *                 description: Down payment amount
 *                 example: 100000
 *               regenerateMandate:
 *                 type: boolean
 *                 description: If true, forces mandate regeneration even if an existing one is Active
 *                 default: false
 *     responses:
 *       200:
 *         description: Invoice approved and loan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invoice updated successfully"
 *                 data:
 *                   type: object
 *                   description: Invoice details
 *       400:
 *         description: Bad request - validation failed or eligibility not valid
 *       401:
 *         description: Unauthorized - Buyer not authenticated
 *       404:
 *         description: Invoice or buyer not found
 *       500:
 *         description: Internal server error
 */

export class InvoiceController {
  /**
   * Create a new invoice with items
   */
  async create(req: Request, res: Response) {
    try {
      const input: CreateInvoiceInput = req.body;

      // Validation
      if (!input.customerName || !input.customerEmail || !input.customerPhoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Customer name, email, and phone number are required',
        });
      }

      if (!input.dueDate) {
        return res.status(400).json({
          success: false,
          message: 'Due date is required',
        });
      }

      if (!input.merchantId && !req.user?.merchantId) {
        return res.status(400).json({
          success: false,
          message: 'Merchant ID is required',
        });
      }

      if (!input.items || input.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invoice must have at least one item',
        });
      }

      const result = await invoiceService.createInvoice({
        ...input,
        merchantId: input.merchantId ?? req.user?.merchantId,
      });

      return res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create invoice',
      });
    }
  }

  /**
   * Get all invoices with filters
   */
  async list(req: Request, res: Response) {
    try {
      const { merchantId, buyerId, status, customerEmail, q, type, page, limit } = req.query;

      const filters: any = {};
      if (merchantId) filters.merchantId = merchantId as string;
      if (buyerId) filters.buyerId = buyerId as string;
      if (status) filters.status = status as InvoiceStatus;
      if (customerEmail) filters.customerEmail = customerEmail as string;
      if (q) filters.q = q as string;
      if (type) filters.type = type as InvoiceType;
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await invoiceService.getAllInvoices(filters);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch invoices',
      });
    }
  }

  /**
   * Get invoice by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await invoiceService.getInvoiceById(id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch invoice',
      });
    }
  }

  /**
   * Get invoice by splitr ID
   */
  async getBysplitrId(req: Request, res: Response) {
    try {
      const { splitrId } = req.params;
      const result = await invoiceService.getInvoiceBysplitrId(splitrId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch invoice',
      });
    }
  }

  /**
   * Get invoices by merchant ID
   */
  async getByMerchantId(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const { status } = req.query;

      const result = await invoiceService.getInvoicesByMerchantId(
        merchantId,
        status as InvoiceStatus | undefined,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error fetching merchant invoices:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch merchant invoices',
      });
    }
  }

  /**
   * Get invoices by buyer ID
   */
  async getByBuyerId(req: Request, res: Response) {
    try {
      const { buyerId } = req.params;
      const { status } = req.query;

      const result = await invoiceService.getInvoicesByBuyerId(
        buyerId,
        status as InvoiceStatus | undefined,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error fetching buyer invoices:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch buyer invoices',
      });
    }
  }

  /**
   * Get invoices by customer email (authenticated user)
   */
  async getByCustomerEmail(req: Request, res: Response) {
    try {
      const { status } = req.query;

      if (!req.user?.email) {
        return res.status(401).json({
          success: false,
          message: 'User email not found. Please log in.',
        });
      }

      const result = await invoiceService.getInvoicesByCustomerEmail(
        req.user.email,
        status as InvoiceStatus | undefined,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error fetching invoices by email:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch invoices by email',
      });
    }
  }

  /**
   * Update invoice
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const input: UpdateInvoiceInput = req.body;
      if (input.returnStatus !== undefined)
        input.returnStatus = input.returnStatus as LoanReturnStatus;
      if (input.returnStatus === LoanReturnStatus.Pending) {
        input.returnInitiatedDate = new Date();
        input.returnInitiatedBy = req.user?.id;
      }
      if (input.returnStatus === LoanReturnStatus.Approved) {
        input.returnApprovedDate = new Date();
        input.returnApprovedBy = req.user?.id;
      }

      const result = await invoiceService.updateInvoice(id, input);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update invoice',
      });
    }
  }

  /**
   * Update invoice status
   */
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(InvoiceStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required (Pending, Paid, or Cancelled)',
        });
      }

      const result = await invoiceService.updateInvoiceStatus(id, status);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update invoice status',
      });
    }
  }

  /**
   * Delete invoice
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await invoiceService.deleteInvoice(id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete invoice',
      });
    }
  }

  /**
   * Calculate invoice total
   */
  async calculateTotal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await invoiceService.calculateInvoiceTotal(id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error calculating invoice total:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate invoice total',
      });
    }
  }

  /**
   * Get merchant invoice statistics
   */
  async getMerchantStats(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const result = await invoiceService.getMerchantInvoiceStats(merchantId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error fetching merchant stats:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch merchant statistics',
      });
    }
  }

  /**
   * Approve invoice and create loan for authenticated buyer
   */
  async approveAndCreateLoan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { loanTenure, downPaymentAmount, regenerateMandate = false } = req.body;
      const buyerId = req.user?.buyerId;

      // Validate required fields
      if (!loanTenure || !downPaymentAmount) {
        return res.status(400).json({
          success: false,
          message: 'loanTenure and downPaymentAmount are required',
        });
      }

      if (!buyerId) {
        return res.status(401).json({
          success: false,
          message: 'Buyer ID not found. Please log in as a buyer.',
        });
      }

      const result = await invoiceService.approveAndCreateLoanInvoice(
        id,
        loanTenure,
        downPaymentAmount,
        buyerId,
        Boolean(regenerateMandate),
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          data: result.data,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error approving invoice and creating loan:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve invoice and create loan',
      });
    }
  }

  /**
   * @swagger
   * /api/v1/invoices/validate/mandate:
   *   get:
   *     summary: Validate invoice mandate
   *     description: |
   *       Validates an invoice mandate by checking its status with Mono API.
   *       Can be queried by either referenceId or invoiceId.
   *       If the mandate is approved in Mono, it will be updated to Active status.
   *     tags: [Invoice]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: referenceId
   *         schema:
   *           type: string
   *         description: Reference ID of the mandate
   *         example: "refO2b9O9E03m"
   *       - in: query
   *         name: invoiceId
   *         schema:
   *           type: string
   *         description: Invoice ID to find the mandate
   *         example: "uuid-here"
   *     responses:
   *       200:
   *         description: Mandate validated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       example: "successful"
   *                     message:
   *                       type: string
   *                       example: "request completed successfully"
   *                     data:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           example: "mmc_682b9c5803c0b736078889a3"
   *                         status:
   *                           type: string
   *                           example: "approved"
   *                         reference:
   *                           type: string
   *                           example: "refO2b9O9E03m"
   *                         amount:
   *                           type: number
   *                           example: 80030
   *                         approved:
   *                           type: boolean
   *                           example: true
   *                         ready_to_debit:
   *                           type: boolean
   *                           example: false
   *       400:
   *         description: Bad request - validation error or mandate not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Mandate not found"
   */
  async validateMandate(req: Request, res: Response) {
    try {
      const { referenceId, invoiceId } = req.query;

      if (!referenceId && !invoiceId) {
        return res.status(400).json({
          success: false,
          message: 'Either referenceId or invoiceId is required',
        });
      }

      const result = await invoiceService.validateMandate({
        referenceId: referenceId as string | undefined,
        invoiceId: invoiceId as string | undefined,
      });

      // Check if result has success property (from Mono API response)
      if (result && result.success !== undefined) {
        return res.status(200).json(result);
      }

      return res.status(200).json({
        success: true,
        message: 'Mandate validated successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to validate mandate',
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/v1/invoices/{id}/initiate-upfront-payment:
   *   post:
   *     summary: Initiate upfront payment for an invoice
   *     description: |
   *       Initiates an upfront payment for an invoice by:
   *       1. Retrieving the invoice and associated mandate
   *       2. Calculating eligibility and required payment amount
   *       3. Initiating a Mono direct pay transaction
   *       4. Creating a DirectPay record
   *     tags: [Invoice]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Invoice ID
   *     responses:
   *       200:
   *         description: Upfront payment initiated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Upfront payment initiated successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     directPay:
   *                       type: object
   *                       properties:
   *                         success:
   *                           type: boolean
   *                           example: true
   *                         data:
   *                           type: object
   *                           properties:
   *                             id:
   *                               type: string
   *                               example: "ODW2QV0WLIDG"
   *                             mono_url:
   *                               type: string
   *                               example: "https://checkout.mono.co/ODW2QV0WLIDG"
   *                             type:
   *                               type: string
   *                               example: "onetime-debit"
   *                             method:
   *                               type: string
   *                               example: "account"
   *                             amount:
   *                               type: number
   *                               example: 21000
   *                             description:
   *                               type: string
   *                               example: "Upfront payment for invoice LPM-2510-100001"
   *                             reference:
   *                               type: string
   *                               example: "A1B2C3D4E5F6"
   *       400:
   *         description: Bad request - validation error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Invoice not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Failed to initiate upfront payment"
   */
  async initiateUpfrontPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }

      const result = await invoiceService.initiateUpfrontPayment(id);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error initiating upfront payment:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to initiate upfront payment',
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/v1/invoices/validate/mandate/downpayment/and/create/loan:
   *   post:
   *     summary: Validate mandate, verify down payment, and create loan invoice
   *     description: |
   *       Validates an invoice mandate, verifies the upfront/down payment status,
   *       checks eligibility, and creates a loan for the invoice.
   *       Requires either invoiceId or referenceId to identify the mandate.
   *     tags: [Invoice]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               invoiceId:
   *                 type: string
   *                 description: Invoice ID to find the mandate
   *                 example: "uuid-here"
   *               referenceId:
   *                 type: string
   *                 description: Reference ID of the mandate
   *                 example: "refO2b9O9E03m"
   *     responses:
   *       200:
   *         description: Mandate validated, down payment verified, and loan created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Invoice updated successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     invoice:
   *                       type: object
   *                       description: Updated invoice details
   *                     loan:
   *                       type: object
   *                       description: Created loan details
   *       400:
   *         description: Bad request - validation error, mandate not found, or upfront payment not completed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Upfront payment not yet completed"
   *                 data:
   *                   type: object
   *       401:
   *         description: Unauthorized - User not authenticated
   *       500:
   *         description: Internal server error
   */
  async validateMandateDownPaymentAndCreateLoan(req: Request, res: Response) {
    try {
      const { invoiceId, referenceId } = req.body;

      if (!invoiceId && !referenceId) {
        return res.status(400).json({
          success: false,
          message: 'Either invoiceId or referenceId is required',
        });
      }

      const result = await invoiceService.validateMandateMandateDownPaymentAndCreateLoanInvoice({
        invoiceId,
        referenceId,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          data: result.data,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error validating mandate and creating loan:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to validate mandate and create loan',
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/v1/invoices/{id}/post-transaction-validation:
   *   get:
   *     summary: Validate post-transaction status for an invoice (mandate and direct debit)
   *     description: |
   *       - Checks the latest mandate for the invoice. If the mandate is Pending in the database, it will verify with Mono first before returning a decision.
   *       - If the mandate is approved, it then checks the latest direct debit (direct pay) associated with the invoice. If the latest direct debit is Pending, it will verify with Mono before returning.
   *       - Returns the current status for both mandate and direct debit.
   *     tags: [Invoice]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Invoice ID
   *     responses:
   *       200:
   *         description: Validation status returned successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     invoiceId:
   *                       type: string
   *                     mandate:
   *                       type: object
   *                       nullable: true
   *                       properties:
   *                         id:
   *                           type: string
   *                         referenceId:
   *                           type: string
   *                           nullable: true
   *                         status:
   *                           type: string
   *                           example: Approved
   *                     directPay:
   *                       type: object
   *                       nullable: true
   *                       properties:
   *                         id:
   *                           type: string
   *                         reference:
   *                           type: string
   *                         status:
   *                           type: string
   *                           example: Pending
   *       400:
   *         description: Bad request - validation error
   *       404:
   *         description: Invoice not found
   *       500:
   *         description: Internal server error
   */
  async validatePostTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }
      const {
        postTransactionValidationService,
      } = require('../services/postTransactionValidationService');
      const result = await postTransactionValidationService.validateInvoicePostTransaction(id);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to validate post-transaction status',
      });
    }
  }

  /**
   * @swagger
   * /api/v1/invoices/refund/calculate:
   *   post:
   *     summary: Calculate refund details for an invoice return
   *     tags: [Invoice]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - approvalDate
 *               - loanStartDate
   *             properties:
   *               downpayment:
   *                 type: number
   *                 default: 0
   *               principalPaymentToDate:
   *                 type: number
   *                 default: 0
   *               approvalDate:
   *                 type: string
   *                 format: date-time
   *                 example: "2026-05-01T00:00:00.000Z"
 *               loanStartDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-04-10T00:00:00.000Z"
   *               currentBalance:
   *                 type: number
   *                 default: 0
   *               unpaidInterest:
   *                 type: number
   *                 default: 0
   *               unpaidPenalty:
   *                 type: number
   *                 default: 0
   *     responses:
   *       200:
   *         description: Refund calculation completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 calculation:
   *                   type: object
   *                   properties:
   *                     assumedRefundable:
   *                       type: number
   *                     refundCharge:
   *                       type: number
   *                     applicableDays:
   *                       type: number
   *                     interestCharge:
   *                       type: number
   *                     unpaidInterest:
   *                       type: number
   *                     unpaidPenalty:
   *                       type: number
   *                     refundDue:
   *                       type: number
   *                 summary:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                     approvalDate:
   *                       type: string
   *                       format: date-time
 *                     loanStartDate:
   *                       type: string
   *                       format: date-time
   *                     totalDeductions:
   *                       type: number
   *       400:
   *         description: Invalid request payload
   *       500:
   *         description: Internal server error
   */
  async calculateRefund(req: Request, res: Response) {
    try {
      const {
        downpayment,
        principalPaymentToDate,
        approvalDate,
        loanStartDate,
        currentBalance,
        unpaidInterest,
        unpaidPenalty,
      } = req.body ?? {};

      if (!approvalDate || !loanStartDate) {
        return res.status(400).json({
          success: false,
          message: 'approvalDate and loanStartDate are required',
        });
      }

      const result = invoiceService.calculateRefund({
        downpayment,
        principalPaymentToDate,
        approvalDate,
        loanStartDate,
        currentBalance,
        unpaidInterest,
        unpaidPenalty,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate refund',
      });
    }
  }

  /**
   * @swagger
   * /api/v1/invoices/{id}/refund/calculate:
   *   get:
   *     summary: Calculate refund details using invoice and loan records
   *     tags: [Invoice]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Invoice ID
   *     responses:
   *       200:
   *         description: Refund calculated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     success:
   *                       type: boolean
   *                       description: Refund calculation status from service
   *                       example: true
   *                     invoiceId:
   *                       type: string
   *                       example: "inv_123456"
   *                     loanId:
   *                       type: string
   *                       example: "loan_123456"
   *                     loanamount:
   *                       type: number
   *                       example: 250000
   *                     insurance:
   *                       type: number
   *                       example: 5000
   *                     adminCharge:
   *                       type: number
   *                       example: 2500
   *                     monthlyRepayment:
   *                       type: number
   *                       example: 22000
   *                     loanTenure:
   *                       type: number
   *                       example: 12
   *                     loanInterestRate:
   *                       type: number
   *                       example: 7.5
   *                     loanStartDate:
   *                       type: string
   *                       format: date-time
   *                     calculation:
   *                       type: object
   *                       properties:
   *                         assumedRefundable:
   *                           type: number
   *                         refundCharge:
   *                           type: number
   *                         applicableDays:
   *                           type: number
   *                         interestCharge:
   *                           type: number
   *                         unpaidInterest:
   *                           type: number
   *                         unpaidPenalty:
   *                           type: number
   *                         refundDue:
   *                           type: number
   *                     summary:
   *                       type: object
   *                       properties:
   *                         message:
   *                           type: string
   *                           example: Refund calculation completed successfully
   *                         approvalDate:
   *                           type: string
   *                           format: date-time
 *                         loanStartDate:
   *                           type: string
   *                           format: date-time
   *                         totalDeductions:
   *                           type: number
   *       400:
   *         description: Refund could not be calculated
   *       404:
   *         description: Invoice or loan not found
   *       500:
   *         description: Internal server error
   */
  async calculateRefundForInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }

      const result = await invoiceService.calculateRefundForInvoice(id);

      if (!result.success) {
        const statusCode = /not found/i.test(result.message || '') ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate refund for invoice',
      });
    }
  }

  /**
   * @swagger
   * /api/v1/invoices/{id}/refund/withdrawal:
   *   post:
   *     summary: Withdraw approved refund to buyer bank account
   *     tags: [Invoice]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Invoice ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - bankCode
   *               - accountNumber
   *             properties:
   *               bankCode:
   *                 type: string
   *                 example: "058"
   *               accountNumber:
   *                 type: string
   *                 example: "0123456789"
   *     responses:
   *       200:
   *         description: Buyer fund withdrawal successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Buyer fund withdrawal successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     paystackTransfer:
   *                       type: object
   *                     paystackTransferResult:
   *                       type: object
   *       400:
   *         description: Invalid request or withdrawal precondition failed
   *       404:
   *         description: Invoice not found
   *       500:
   *         description: Internal server error
   */
  async buyerFundWithdrawal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { bankCode, accountNumber } = req.body ?? {};

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }

      if (!bankCode || !accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'bankCode and accountNumber are required',
        });
      }

      const result = await invoiceService.buyerFundWithdrawal({
        invoiceId: id,
        bankCode,
        accountNumber,
      });

      if (!result.success) {
        const statusCode = /not found/i.test(result.message || '') ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to process buyer fund withdrawal',
      });
    }
  }
}

export const invoiceController = new InvoiceController();
