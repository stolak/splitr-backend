import { Router } from 'express';
import { invoiceController } from '../controllers/invoiceController';
import { invoiceExtractionController } from '../controllers/invoiceExtractionController';
import { authenticateJWT } from '../middlewares/auth';
import { uploadInvoice } from '../middlewares/invoiceUpload';

const router = Router();

/**
 * @swagger
 * /api/v1/invoices/extract:
 *   post:
 *     summary: Extract invoice data from a PDF, PNG, or JPEG
 *     tags: [Invoice]
 *     parameters:
 *       - in: query
 *         name: includeRawText
 *         schema:
 *           type: boolean
 *         description: Include the cleaned source text in the response when true
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [invoice]
 *             properties:
 *               invoice:
 *                 type: string
 *                 format: binary
 *                 description: PDF, PNG, or JPEG invoice file
 *     responses:
 *       200:
 *         description: Extracted invoice data
 *       400:
 *         description: Missing file, unsupported type, or unreadable document
 */
router.post('/extract', uploadInvoice, invoiceExtractionController.extract);

// Create new invoice with items
router.post('/', authenticateJWT, invoiceController.create);

// Get all invoices with filters and pagination
router.get('/', invoiceController.list);

// Get invoice by splitr ID (must be before /:id route)
router.get('/splitr/:splitrId', invoiceController.getBysplitrId);

// Get merchant invoices
router.get('/merchant/:merchantId', invoiceController.getByMerchantId);

// Get merchant invoice statistics
router.get('/merchant/:merchantId/stats', invoiceController.getMerchantStats);

// Get buyer invoices impacted by a return or refund
router.get('/buyer/refunds', authenticateJWT, invoiceController.getBuyerRefundInvoices);

// Get buyer invoices
router.get('/buyer/:buyerId', invoiceController.getByBuyerId);

// Get invoices by customer email (authenticated user)
router.get('/my-invoices', authenticateJWT, invoiceController.getByCustomerEmail);

// Calculate refund details for invoice return
router.post('/refund/calculate', invoiceController.calculateRefund);

// Calculate full amortization schedule (no auth)
router.post('/calculate-schedule', invoiceController.calculateSchedule);

// Calculate refund details by invoice id
router.get('/:id/refund/calculate', invoiceController.calculateRefundForInvoice);

// Withdraw approved refund to buyer bank account
router.post('/:id/refund/withdrawal', authenticateJWT, invoiceController.buyerFundWithdrawal);

// Get invoice by ID
router.get('/:id', invoiceController.getById);

// Calculate invoice total
router.get('/:id/total', invoiceController.calculateTotal);

// Approve invoice and create loan (authenticated buyer)
router.post(
  '/:id/approve-and-create-loan',
  authenticateJWT,
  invoiceController.approveAndCreateLoan,
);

// Approve invoice and create loan (Splitr flow)
router.post(
  '/:id/approve-and-create-loan-splitr',
  authenticateJWT,
  invoiceController.approveAndCreateLoanSplitr,
);

// Approve invoice and create loan (product finance quote flow)
router.post(
  '/:id/approve-and-create-loan-finance',
  authenticateJWT,
  invoiceController.approveAndCreateLoanFinance,
);

// Validate post-transaction (mandate + direct debit) for invoice
router.get(
  '/:id/post-transaction-validation',
  // authenticateJWT,
  invoiceController.validatePostTransaction,
);

// Validate mandate by referenceId or invoiceId
router.get(
  '/validate/mandate',
  // authenticateJWT,
  invoiceController.validateMandate,
);

// Initiate upfront payment for invoice
router.post(
  '/:id/initiate-upfront-payment',
  // authenticateJWT,
  invoiceController.initiateUpfrontPayment,
);

// Validate mandate, verify down payment, and create loan invoice
router.post(
  '/validate/mandate/downpayment/and/create/loan',
  // authenticateJWT,
  invoiceController.validateMandateDownPaymentAndCreateLoan,
);

// Update invoice return / refund details
router.patch('/:id/return', authenticateJWT, invoiceController.updateReturn);

// Update invoice status
router.patch('/:id/status', invoiceController.updateStatus);

// Update invoice
router.patch('/:id', invoiceController.update);

// Delete invoice
router.delete('/:id', invoiceController.delete);

export default router;
