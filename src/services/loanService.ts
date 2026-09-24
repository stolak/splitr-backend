import {
  PrismaClient,
  LoanStatus,
  LoanType,
  DocumentStatus,
  TransactionType,
  TransactionStatus,
  LoanPenaltyStatus,
  LoanScheduleStatus,
  RevenueType,
  DirectPayType,
  LoanInstallmentType,
  InvoiceStatus,
  PaymentType,
} from "@prisma/client";
import {
  normalizeToMidnight,
  getDayBeforeNextCycleByInstallmentType,
  getNextCycleByInstallmentType,
  roundUpTo2Decimals,
  calculateOverdueAmount,
  Schedule,
} from "../utils/helper";
import {
  GetLoanBalanceInput,
  LoanScheduleRecord,
  calculateSchedule,
  countClosedSchedules,
  flatRateInterestCalculation,
  getAmountDue,
  getLoanBalance,
  getLoanBalanceByTransactionType3,
  getLoanLiquidatingBalance,
  nextSchedule,
} from "../utils/loanHelper";
import { randomUUID } from "crypto";
import { RevenueService } from "./revenueService";
import { AccountDetailsService } from "./accountDetailsService";
import { InvoiceMandateService } from "./invoiceMandateService";
import { generateShortReferenceId } from "./invoiceService";
import { directPayService } from "./directPayService";
import { DirectPayStatus, PaymentProvider } from "@prisma/client";
import prisma from "../utils/prisma";
import { buyerService } from "./buyerService";
import { mandateDebitService } from "../services/mandateDebitService";
import { BuyerFinanceQuoteProductOutcome } from "./scoringService";
import { stripeService } from "./stripeService";
import stripe from "../routes/stripe";

const revenueService = new RevenueService();
const accountDetailsService = new AccountDetailsService();
const invoiceMandateService = new InvoiceMandateService();
// ==================== INTERFACES ====================

// Loan interfaces
export interface CreateLoanInput {
  buyerId: string;
  loanAmount: number;
  purchaseAmount?: number;
  downPaymentAmount?: number;
  merchantId?: string;
  referenceNumber?: string;
  adminCharge?: number;
  insurance?: number;
  monthlyRepayment?: number;
  loanTenure: number;
  loanInterestRate: number;
  loanStartDate: Date;
  loanEndDate?: Date;
  loanStatus: LoanStatus;
  loanType: LoanType;
  loanPurpose: string;
  loanDocument?: string;
  loanDocumentVerified?: DocumentStatus;
  invoiceId?: string;
  installmentType?: LoanInstallmentType;
  /** FK to ProductConfiguration */
  productId?: string;
  /** Finance quote outcome used to build installment schedules (not persisted as-is) */
  product?: BuyerFinanceQuoteProductOutcome;
}

export interface UpdateLoanInput {
  loanAmount?: number;
  purchaseAmount?: number;
  downPaymentAmount?: number;
  merchantId?: string;
  referenceNumber?: string;
  adminCharge?: number;
  insurance?: number;
  monthlyRepayment?: number;
  loanTenure?: number;
  loanInterestRate?: number;
  loanStartDate?: Date;
  loanEndDate?: Date;
  loanStatus?: LoanStatus;
  loanType?: LoanType;
  loanPurpose?: string;
  loanDocument?: string;
  loanDocumentVerified?: DocumentStatus;
  invoiceId?: string | null;
  productId?: string | null;
}

const loanProductConfigurationSelect = {
  id: true,
  productType: true,
  code: true,
  productName: true,
  tenure: true,
  minimumFinance: true,
  maximumFinance: true,
  rate: true,
} as const;

// LoanSchedule interfaces
export interface CreateLoanScheduleInput {
  loanId: string;
  start: Date;
  end: Date;
  expectedPayment: number;
  actualPayment?: number;
  expectedBalance?: number;
  expectedClosingBalance?: number;
  openingBalance?: number;
  status?: LoanScheduleStatus;
  isExecuted?: boolean;
}

export interface UpdateLoanScheduleInput {
  start?: Date;
  end?: Date;
  expectedPayment?: number;
  actualPayment?: number;
  expectedClosingBalance?: number;
  expectedBalance?: number;
}

// LoanPenaltySchedule interfaces
export interface CreateLoanPenaltyScheduleInput {
  loanScheduleId: string;
  start: Date;
  end: Date;
  percentage: number;
  isExecuted?: boolean;
  executedAt?: Date;
}

export interface UpdateLoanPenaltyScheduleInput {
  start?: Date;
  end?: Date;
  percentage?: number;
  isExecuted?: boolean;
  executedAt?: Date;
}

// LoanPenalty interfaces
export interface CreateLoanPenaltyInput {
  dayAfter: number;
  percentage: number;
  status?: LoanPenaltyStatus;
}

export interface UpdateLoanPenaltyInput {
  dayAfter?: number;
  percentage?: number;
  status?: LoanPenaltyStatus;
}

// LoanDebitTrial interfaces
export interface CreateLoanDebitTrialInput {
  dayAfter: number;
  status?: LoanPenaltyStatus;
}

export interface UpdateLoanDebitTrialInput {
  dayAfter?: number;
  status?: LoanPenaltyStatus;
}

// LoanDebitTrialSchedule interfaces
export interface CreateLoanDebitTrialScheduleInput {
  loanScheduleId: string;
  start: Date;
  end: Date;
  isExecuted?: boolean;
  executedAt?: Date;
}

export interface UpdateLoanDebitTrialScheduleInput {
  start?: Date;
  end?: Date;
  isExecuted?: boolean;
  executedAt?: Date;
}

// LoanTransaction interfaces
export interface CreateLoanTransactionInput {
  loanId: string;
  transactionType: TransactionType;
  transactionStatus?: TransactionStatus;
  creditAmount: number;
  debitAmount: number;
  transactionDate: Date;
  description: string;
  scheduleId?: string;
  transactReference?: string;
  paymentType?: PaymentType;
}

export interface UpdateLoanTransactionInput {
  transactionType?: TransactionType;
  transactionStatus?: TransactionStatus;
  creditAmount?: number;
  debitAmount?: number;
  transactionDate?: Date;
  paymentType?: PaymentType;
}

export interface CreateLoanPaymentInput {
  loanId: string;
  credit?: number;
  debit?: number;
  principal?: number;
  interest?: number;
  penalty?: number;
  paymentType: PaymentType;
  transactionReference?: string;
  remarks: string;
  scheduleId?: string;
}

const INTEREST_RATE = 7.5;
export class LoanService {
  // ==================== LOAN CRUD ====================

  /**
   * Create a new loan
   */
  async createLoan(input: CreateLoanInput) {
    try {
      // Verify buyer exists
      const buyer = await prisma.buyer.findUnique({
        where: { id: input.buyerId },
      });

      if (!buyer) {
        throw new Error("Buyer not found");
      }

      if (input.referenceNumber) {
        // check if reference number is already used
        const existingLoan = await prisma.loan.findFirst({
          where: { referenceNumber: input.referenceNumber },
        });
        if (existingLoan) {
          throw new Error("Reference number already used. Duplicate loan not allowed.");
        }
      }

      if (input.invoiceId) {
        const invoice = await prisma.invoice.findUnique({
          where: { id: input.invoiceId },
        });

        if (!invoice) {
          throw new Error("Invoice not found");
        }

        const existingLoanForInvoice = await prisma.loan.findFirst({
          where: { invoiceId: input.invoiceId },
        });

        if (existingLoanForInvoice) {
          throw new Error("Invoice already linked to another loan");
        }
      }

      const productId = input.productId ?? input.product?.productConfigurationId;
      if (productId) {
        const productConfiguration = await prisma.productConfiguration.findUnique({
          where: { id: productId },
        });
        if (!productConfiguration) {
          throw new Error("Product configuration not found");
        }
      }

      // Convert dates to Date objects if they're strings
      const loanStartDate = new Date(input.loanStartDate);
      const loanEndDate = input.loanEndDate ? new Date(input.loanEndDate) : undefined;

      const loan = await prisma.loan.create({
        data: {
          splitrId: "", // Will be auto-generated by trigger
          buyerId: input.buyerId,
          invoiceId: input.invoiceId,
          loanAmount: roundUpTo2Decimals(input.loanAmount),
          purchaseAmount: roundUpTo2Decimals(input.purchaseAmount),
          downPaymentAmount: roundUpTo2Decimals(input.downPaymentAmount),
          merchantId: input.merchantId,
          referenceNumber: input.referenceNumber,
          adminCharge: roundUpTo2Decimals(input.adminCharge),
          insurance: roundUpTo2Decimals(input.insurance),
          monthlyRepayment: roundUpTo2Decimals(input.monthlyRepayment),
          loanInstallmentType: input.installmentType,
          loanTenure: input.loanTenure,
          loanInterestRate: roundUpTo2Decimals(input.loanInterestRate),
          loanStartDate: loanStartDate,
          loanEndDate: loanEndDate,
          loanStatus: input.loanStatus,
          loanType: input.loanType,
          loanPurpose: input.loanPurpose,
          loanDocument: input.loanDocument,
          loanDocumentVerified: input.loanDocumentVerified || DocumentStatus.Pending,
          productId,
        },
        include: {
          buyer: {
            select: {
              id: true,
              splitrId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          product: {
            select: loanProductConfigurationSelect,
          },
        },
      });

      // Create loan schedules from product installments when available;
      // otherwise fall back to tenure-based equal repayment cycles.
      const product = input.product;
      const installments = product?.installments;
      let expectedBalance = input.loanAmount;
      let partPayment = 0;
      let periodicInstallment = 0;
      let firstScheduleId = "";
      if (installments && installments.length > 0) {
        const cycleType = product?.productType === "BI_WEEKLY" ? "BiWeekly" : "Monthly";
        const today = new Date(loanStartDate);

        periodicInstallment = roundUpTo2Decimals(Number(product?.periodicInstallment));
        // First installment is due immediately: start and end are today
        const [firstInstallment, ...remainingInstallments] = installments;
        partPayment = roundUpTo2Decimals(
          Number(firstInstallment.amount) - Number(product?.partPayment)
        );
        let expectedBalanceCursor = product?.financeAmount;
        let scheduleStep = nextSchedule(
          input.loanInterestRate,
          Number(loan.loanAmount),
          Number(input.monthlyRepayment),
          cycleType
        );
        const firstSchedule = await this.createLoanSchedule({
          loanId: loan.id,
          start: today,
          end: today,
          status: LoanScheduleStatus.Closed,
          actualPayment: Number(input.monthlyRepayment),
          expectedPayment: Number(input.monthlyRepayment),
          expectedBalance: scheduleStep.openingBalance,
          openingBalance: scheduleStep.openingBalance,
          isExecuted: true,
          expectedClosingBalance: scheduleStep.closingBalance,
        });
        if (firstSchedule) {
          firstScheduleId = firstSchedule.data?.id ?? "";
        }
        expectedBalanceCursor = scheduleStep.closingBalance;

        // Subsequent installments begin on the next product-type interval from today
        // (BI_WEEKLY → +14 days, MONTHLY_FLEX → +1 month) and continue on that cadence

        let nextcycle = new Date(today);
        for (const installment of remainingInstallments) {
          const expectedPayment = roundUpTo2Decimals(Number(installment.amount));
          const cycleEnd = getDayBeforeNextCycleByInstallmentType(
            new Date(nextcycle).toISOString(),
            cycleType
          );

          scheduleStep = nextSchedule(
            Number(loan.loanInterestRate),
            expectedBalanceCursor,
            Number(input.monthlyRepayment),
            cycleType
          );

          this.createLoanSchedule({
            loanId: loan.id,
            start: nextcycle,
            end: cycleEnd,
            expectedPayment,
            openingBalance: scheduleStep.openingBalance,
            expectedBalance: expectedBalanceCursor,
            expectedClosingBalance: scheduleStep.closingBalance,
          });

          nextcycle = getNextCycleByInstallmentType(new Date(nextcycle).toISOString(), cycleType);
          expectedBalanceCursor = scheduleStep.closingBalance;
        }

        expectedBalance = expectedBalanceCursor;
      } else {
        const installmentType = input.installmentType ?? LoanInstallmentType.Monthly;
        let nextcycle = getNextCycleByInstallmentType(
          new Date(loanStartDate).toISOString(),
          installmentType
        );
        for (let i = 1; i <= input.loanTenure; i++) {
          const cycleEnd =
            installmentType === LoanInstallmentType.OneTime
              ? (loanEndDate ?? nextcycle)
              : getDayBeforeNextCycleByInstallmentType(
                  new Date(nextcycle).toISOString(),
                  installmentType
                );

          const interestOnBalance = roundUpTo2Decimals(
            Number(loan.loanInterestRate) * 0.01 * expectedBalance
          );
          const expectedClosingBalance = roundUpTo2Decimals(
            expectedBalance + interestOnBalance - Number(input.monthlyRepayment)
          );

          this.createLoanSchedule({
            loanId: loan.id,
            start: nextcycle,
            end: cycleEnd,
            expectedPayment: roundUpTo2Decimals(Number(input.monthlyRepayment)),
            expectedBalance: roundUpTo2Decimals(expectedBalance),
            expectedClosingBalance,
          });
          nextcycle = getNextCycleByInstallmentType(
            new Date(nextcycle).toISOString(),
            installmentType
          );
          expectedBalance = expectedClosingBalance;
        }
      }
      if (input.loanStatus === LoanStatus.Active) {
        await this.createLoanTransaction({
          loanId: loan.id,
          transactionType: TransactionType.principal,
          transactionStatus: TransactionStatus.Completed,
          creditAmount: input.loanAmount,
          debitAmount: 0,
          transactionDate: new Date(),
          description: "Initial Loan disbursement",
          paymentType: PaymentType.instant,
        });

        const interestAmount = roundUpTo2Decimals(
          input.installmentType === LoanInstallmentType.Monthly
            ? ((Number(input.loanAmount) * Number(loan.loanInterestRate)) / 12) * 0.01
            : periodicInstallment - Number(input.loanAmount) / input.loanTenure
        );
        const principalAmount = roundUpTo2Decimals(Number(input.monthlyRepayment) - interestAmount);

        await this.createLoanTransaction({
          loanId: loan.id,
          transactionType: TransactionType.interest,
          transactionStatus: TransactionStatus.Completed,
          creditAmount: interestAmount,
          debitAmount: 0,
          transactionDate: new Date(),
          description: "Instant Loan interest charge",
          scheduleId: firstScheduleId,
          paymentType: PaymentType.instant,
        });
        this.createLoanTransaction({
          loanId: loan.id,
          transactionType: TransactionType.interest,
          transactionStatus: TransactionStatus.Completed,
          creditAmount: 0,
          debitAmount: interestAmount,
          transactionDate: new Date(),
          description: "Instant Loan interest repayment",
          scheduleId: firstScheduleId,
          paymentType: PaymentType.instant,
        });
        this.createLoanTransaction({
          loanId: loan.id,
          transactionType: TransactionType.principal,
          transactionStatus: TransactionStatus.Completed,
          creditAmount: 0,
          debitAmount: principalAmount,
          transactionDate: new Date(),
          description: "Initial Loan principal repayment",
          scheduleId: firstScheduleId,
          paymentType: PaymentType.instant,
        });
      }

      return { success: true, data: loan, partPayment, periodicInstallment };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan by ID
   */
  async getLoanById(loanId: string) {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
          buyer: {
            select: {
              id: true,
              splitrId: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          merchant: {
            select: {
              id: true,
              splitrId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          product: {
            select: loanProductConfigurationSelect,
          },
          loanSchedules: {
            orderBy: { end: "asc" },
          },
          loanTransactions: {
            orderBy: [{ transactionDate: "desc" }, { updatedAt: "asc" }, { id: "desc" }],
          },
          loanPayments: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      const principalBalance = getLoanBalanceByTransactionType3(
        TransactionType.principal,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const interestBalance = getLoanBalanceByTransactionType3(
        TransactionType.interest,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const penaltyBalance = getLoanBalanceByTransactionType3(
        TransactionType.penalty,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const overallBalance = getLoanBalance(
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const liquidatingBalance = getLoanLiquidatingBalance(
        loan.loanTransactions as unknown as GetLoanBalanceInput[],
        principalBalance,
        Number(loan.loanInterestRate),
        loan.loanInstallmentType
      );
      const amountDue = getAmountDue(loan);
      const overdueBalance = calculateOverdueAmount(
        loan.loanSchedules as unknown as Schedule[],
        overallBalance
      );
      return {
        success: true,
        data: {
          ...loan,
          principalBalance,
          interestBalance,
          penaltyBalance,
          overallBalance,
          liquidatingBalance,
          nextPaymentDate: loan.loanSchedules[0]?.end,
          nextPaymentAmount: loan.loanSchedules[0]?.expectedPayment,
          monthCompleted: countClosedSchedules(
            loan.loanSchedules as unknown as LoanScheduleRecord[]
          ),
          ...amountDue,
          overdueBalance,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan by splitrId
   */
  async getLoanBysplitrId(splitrId: string) {
    try {
      const loan = await prisma.loan.findUnique({
        where: { splitrId },
        include: {
          buyer: true,
          merchant: {
            select: {
              id: true,
              splitrId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          product: {
            select: loanProductConfigurationSelect,
          },
          loanSchedules: true,
          loanTransactions: true,
          loanPayments: true,
        },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      return { success: true, data: loan };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan by invoice ID
   */
  async getLoanByInvoiceId(invoiceId: string) {
    try {
      const loan = await prisma.loan.findFirst({
        where: { invoiceId },
        include: {
          buyer: {
            select: {
              id: true,
              splitrId: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          merchant: {
            select: {
              id: true,
              splitrId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          product: {
            select: loanProductConfigurationSelect,
          },
          loanSchedules: {
            orderBy: { start: "asc" },
          },
          loanTransactions: {
            orderBy: { transactionDate: "desc" },
          },
          loanPayments: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!loan) {
        throw new Error("Loan not found for this invoice");
      }

      const principalBalance = getLoanBalanceByTransactionType3(
        TransactionType.principal,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const interestBalance = getLoanBalanceByTransactionType3(
        TransactionType.interest,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const penaltyBalance = getLoanBalanceByTransactionType3(
        TransactionType.penalty,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const overallBalance = getLoanBalance(
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const liquidatingBalance = getLoanLiquidatingBalance(
        loan.loanTransactions as unknown as GetLoanBalanceInput[],
        principalBalance,
        Number(loan.loanInterestRate),
        loan.loanInstallmentType
      );
      const amountDue = getAmountDue(loan);
      return {
        success: true,
        data: {
          ...loan,
          principalBalance,
          interestBalance,
          penaltyBalance,
          overallBalance,
          nextPaymentDate: loan.loanSchedules[0]?.end,
          nextPaymentAmount: loan.loanSchedules[0]?.expectedPayment,
          liquidatingBalance,
          monthCompleted: countClosedSchedules(
            loan.loanSchedules as unknown as LoanScheduleRecord[]
          ),
          ...amountDue,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all loans with optional filters
   */
  async getAllLoans(filters?: {
    buyerId?: string;
    loanStatus?: LoanStatus;
    loanType?: LoanType;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.buyerId) where.buyerId = filters.buyerId;
      if (filters?.loanStatus) where.loanStatus = filters.loanStatus;
      if (filters?.loanType) where.loanType = filters.loanType;

      const [loans, total] = await Promise.all([
        prisma.loan.findMany({
          where,
          skip,
          take: limit,
          include: {
            buyer: {
              select: {
                id: true,
                splitrId: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
            merchant: {
              select: {
                id: true,
                splitrId: true,
                businessName: true,
                businessEmail: true,
                businessCategory: true,
              },
            },
            product: {
              select: loanProductConfigurationSelect,
            },
            loanSchedules: {
              orderBy: { start: "asc" },
            },
            loanTransactions: {
              orderBy: [{ transactionDate: "asc" }, { updatedAt: "asc" }, { id: "asc" }],
            },
            loanPayments: {
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.loan.count({ where }),
      ]);
      const loanWithBalance = loans.map((loan) => {
        const principalBalance = getLoanBalanceByTransactionType3(
          TransactionType.principal,
          loan.loanTransactions as unknown as GetLoanBalanceInput[]
        );
        const interestBalance = getLoanBalanceByTransactionType3(
          TransactionType.interest,
          loan.loanTransactions as unknown as GetLoanBalanceInput[]
        );
        const penaltyBalance = getLoanBalanceByTransactionType3(
          TransactionType.penalty,
          loan.loanTransactions as unknown as GetLoanBalanceInput[]
        );
        const overallBalance = getLoanBalance(
          loan.loanTransactions as unknown as GetLoanBalanceInput[]
        );
        const liquidatingBalance = getLoanLiquidatingBalance(
          loan.loanTransactions as unknown as GetLoanBalanceInput[],
          principalBalance,
          Number(loan.loanInterestRate),
          loan.loanInstallmentType
        );
        const overdueBalance = calculateOverdueAmount(
          loan.loanSchedules as unknown as Schedule[],
          overallBalance
        );
        return {
          ...loan,
          principalBalance,
          interestBalance,
          penaltyBalance,
          overallBalance,
          liquidatingBalance,
          nextPaymentDate: loan.loanSchedules[0]?.end,
          nextPaymentAmount: loan.loanSchedules[0]?.expectedPayment,
          monthCompleted: countClosedSchedules(
            loan.loanSchedules as unknown as LoanScheduleRecord[]
          ),
          overdueBalance,
        };
      });
      return {
        success: true,
        data: {
          loans: loanWithBalance,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan
   */
  async updateLoan(loanId: string, input: UpdateLoanInput) {
    if (input.referenceNumber) {
      // check if reference number is already used
      const existingLoan = await prisma.loan.findFirst({
        where: { referenceNumber: input.referenceNumber, id: { not: loanId } },
      });
      if (existingLoan) {
        throw new Error("Reference number already used. Duplicate loan not allowed.");
      }
    }
    const prevLoan = await this.getLoanById(loanId);
    if (!prevLoan.success) {
      throw new Error(prevLoan.error);
    }
    const { data: prevLoanData } = prevLoan;

    if (input.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: input.invoiceId },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const existingLoanForInvoice = await prisma.loan.findFirst({
        where: {
          invoiceId: input.invoiceId,
          id: { not: loanId },
        },
      });

      if (existingLoanForInvoice) {
        throw new Error("Invoice already linked to another loan");
      }
    }

    if (input.productId) {
      const productConfiguration = await prisma.productConfiguration.findUnique({
        where: { id: input.productId },
      });
      if (!productConfiguration) {
        throw new Error("Product configuration not found");
      }
    }

    try {
      const roundedUpdateData: UpdateLoanInput = {
        ...input,
        ...(input.loanAmount !== undefined && {
          loanAmount: roundUpTo2Decimals(input.loanAmount),
        }),
        ...(input.purchaseAmount !== undefined && {
          purchaseAmount: roundUpTo2Decimals(input.purchaseAmount),
        }),
        ...(input.downPaymentAmount !== undefined && {
          downPaymentAmount: roundUpTo2Decimals(input.downPaymentAmount),
        }),
        ...(input.adminCharge !== undefined && {
          adminCharge: roundUpTo2Decimals(input.adminCharge),
        }),
        ...(input.insurance !== undefined && {
          insurance: roundUpTo2Decimals(input.insurance),
        }),
        ...(input.monthlyRepayment !== undefined && {
          monthlyRepayment: roundUpTo2Decimals(input.monthlyRepayment),
        }),
        ...(input.loanInterestRate !== undefined && {
          loanInterestRate: roundUpTo2Decimals(input.loanInterestRate),
        }),
      };

      const loan = await prisma.loan.update({
        where: { id: loanId },
        data: roundedUpdateData,
        include: {
          buyer: true,
          merchant: {
            select: {
              id: true,
              splitrId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          product: {
            select: loanProductConfigurationSelect,
          },
        },
      });

      if (
        input.loanStatus === LoanStatus.Active &&
        prevLoanData?.loanStatus !== LoanStatus.Active
      ) {
        await this.createLoanTransaction({
          loanId: loan.id,
          transactionType: TransactionType.principal,
          transactionStatus: TransactionStatus.Pending,
          creditAmount: input.loanAmount
            ? Number(input.loanAmount)
            : Number(prevLoanData?.loanAmount) || 0,
          debitAmount: 0,
          transactionDate: new Date(),
          description: `Initial load disbursement`,
          paymentType: PaymentType.instant,
        });
      }

      return { success: true, data: loan };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan (soft delete by updating status)
   */
  async deleteLoan(loanId: string) {
    try {
      // Check if loan has transactions
      const transactionsCount = await prisma.loanTransaction.count({
        where: { loanId },
      });

      if (transactionsCount > 0) {
        throw new Error("Cannot delete loan with existing transactions");
      }

      const loan = await prisma.loan.delete({
        where: { id: loanId },
      });

      return {
        success: true,
        data: loan,
        message: "Loan deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Force-delete a loan and all dependent records linked to the loan id.
   */
  async forceDeleteLoan(loanId: string) {
    try {
      const existingLoan = await prisma.loan.findUnique({
        where: { id: loanId },
        select: { id: true, splitrId: true, invoiceId: true },
      });

      if (!existingLoan) {
        throw new Error("Loan not found");
      }

      const deleted = await prisma.$transaction(async (tx) => {
        const schedules = await tx.loanSchedule.findMany({
          where: { loanId },
          select: { id: true },
        });
        const scheduleIds = schedules.map((schedule) => schedule.id);

        let loanPenaltySchedules = 0;
        let loanDebitTrialSchedules = 0;

        if (scheduleIds.length > 0) {
          const penaltyResult = await tx.loanPenaltySchedule.deleteMany({
            where: { loanScheduleId: { in: scheduleIds } },
          });
          const debitTrialResult = await tx.loanDebitTrialSchedule.deleteMany({
            where: { loanScheduleId: { in: scheduleIds } },
          });
          loanPenaltySchedules = penaltyResult.count;
          loanDebitTrialSchedules = debitTrialResult.count;
        }

        const loanTransactions = await tx.loanTransaction.deleteMany({
          where: { loanId },
        });
        const loanPayments = await tx.loanPayment.deleteMany({
          where: { loanId },
        });
        const loanSchedules = await tx.loanSchedule.deleteMany({
          where: { loanId },
        });
        const mandateDebits = await tx.mandateDebit.deleteMany({
          where: { loanId },
        });
        const revenues = await tx.revenue.deleteMany({
          where: { loanId },
        });
        const stripePaymentIntents = await tx.stripePaymentIntent.deleteMany({
          where: { loanId },
        });
        const stripeMandates = await tx.stripeMandate.deleteMany({
          where: { loanId },
        });

        // Unlink mandates that still point at this loan (invoice mandates may be shared)
        const mandatesUnlinked = await tx.invoiceMandate.updateMany({
          where: { loanId },
          data: { loanId: null },
        });

        let invoiceResetToPending = false;
        if (existingLoan.invoiceId) {
          await tx.invoice.update({
            where: { id: existingLoan.invoiceId },
            data: { status: InvoiceStatus.Pending },
          });
          invoiceResetToPending = true;
        }

        const loan = await tx.loan.delete({
          where: { id: loanId },
        });

        return {
          loan,
          invoiceId: existingLoan.invoiceId,
          invoiceResetToPending,
          deletedCounts: {
            loanTransactions: loanTransactions.count,
            loanPayments: loanPayments.count,
            loanSchedules: loanSchedules.count,
            loanPenaltySchedules,
            loanDebitTrialSchedules,
            mandateDebits: mandateDebits.count,
            revenues: revenues.count,
            stripePaymentIntents: stripePaymentIntents.count,
            stripeMandates: stripeMandates.count,
            mandatesUnlinked: mandatesUnlinked.count,
          },
        };
      });

      return {
        success: true,
        data: deleted,
        message: "Loan and associated records force-deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN SCHEDULE CRUD ====================

  /**
   * Create loan schedule
   */
  async createLoanSchedule(input: CreateLoanScheduleInput) {
    try {
      // Verify loan exists
      const loan = await prisma.loan.findUnique({
        where: { id: input.loanId },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      const schedule = await prisma.loanSchedule.create({
        data: {
          loanId: input.loanId,
          start: input.start,
          end: input.end,
          expectedPayment: roundUpTo2Decimals(input.expectedPayment),
          actualPayment: roundUpTo2Decimals(input.actualPayment),
          expectedBalance: roundUpTo2Decimals(input.expectedBalance || 0),
          expectedClosingBalance: roundUpTo2Decimals(input.expectedClosingBalance || 0),
          openingBalance: roundUpTo2Decimals(input.openingBalance || 0),
          isExecuted: input.isExecuted || false,
          status: input.status || LoanScheduleStatus.Open,
        },
        include: {
          loan: {
            select: {
              id: true,
              splitrId: true,
              loanAmount: true,
            },
          },
        },
      });
      // Create penalty schedules

      if (loan.loanInstallmentType === LoanInstallmentType.Monthly) {
        const getAllLoanPenalties = await this.getAllLoanPenalties(LoanPenaltyStatus.Active);
        if (getAllLoanPenalties.success && getAllLoanPenalties.data) {
          for (let i = 0; i < getAllLoanPenalties.data.length; i++) {
            const penalty = getAllLoanPenalties.data[i];

            await this.createLoanPenaltySchedule({
              loanScheduleId: schedule.id,
              start: new Date(schedule.start.getTime() + penalty.dayAfter * 24 * 60 * 60 * 1000),
              end: input.end,
              percentage: Number(penalty.percentage),
              isExecuted: false,
            });
          }
        }
      }
      // Create debit trial schedules
      const getAllLoanDebitTrials = await this.getAllLoanDebitTrials(LoanPenaltyStatus.Active);
      if (getAllLoanDebitTrials.success && getAllLoanDebitTrials.data) {
        for (let i = 0; i < getAllLoanDebitTrials.data.length; i++) {
          const debitTrial = getAllLoanDebitTrials.data[i];

          await this.createLoanDebitTrialSchedule({
            loanScheduleId: schedule.id,
            start: new Date(schedule.start.getTime() + debitTrial.dayAfter * 24 * 60 * 60 * 1000),
            end: input.end,
            isExecuted: false,
          });
        }
      }

      return { success: true, data: schedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan schedule by ID
   */
  async getLoanScheduleById(scheduleId: string) {
    try {
      const schedule = await prisma.loanSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          loan: true,
          penaltySchedule: true,
        },
      });

      if (!schedule) {
        throw new Error("Loan schedule not found");
      }

      return { success: true, data: schedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all schedules for a loan
   */
  async getLoanSchedulesByLoanId(loanId: string) {
    try {
      const schedules = await prisma.loanSchedule.findMany({
        where: { loanId },
        include: {
          penaltySchedule: true,
        },
        orderBy: { start: "asc" },
      });

      return { success: true, data: schedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan schedule
   */
  async updateLoanSchedule(scheduleId: string, input: UpdateLoanScheduleInput) {
    try {
      const roundedInput: UpdateLoanScheduleInput = {
        ...input,
        ...(input.expectedPayment !== undefined && {
          expectedPayment: roundUpTo2Decimals(input.expectedPayment),
        }),
        ...(input.actualPayment !== undefined && {
          actualPayment: roundUpTo2Decimals(input.actualPayment),
        }),
        ...(input.expectedBalance !== undefined && {
          expectedBalance: roundUpTo2Decimals(input.expectedBalance),
        }),
        ...(input.expectedClosingBalance !== undefined && {
          expectedClosingBalance: roundUpTo2Decimals(input.expectedClosingBalance),
        }),
      };
      const schedule = await prisma.loanSchedule.update({
        where: { id: scheduleId },
        data: roundedInput,
      });

      return { success: true, data: schedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan schedule
   */
  async deleteLoanSchedule(scheduleId: string) {
    try {
      const schedule = await prisma.loanSchedule.delete({
        where: { id: scheduleId },
      });

      return {
        success: true,
        data: schedule,
        message: "Loan schedule deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN PENALTY SCHEDULE CRUD ====================

  /**
   * Create loan penalty schedule
   */
  async createLoanPenaltySchedule(input: CreateLoanPenaltyScheduleInput) {
    try {
      // Verify loan schedule exists
      const loanSchedule = await prisma.loanSchedule.findUnique({
        where: { id: input.loanScheduleId },
      });

      if (!loanSchedule) {
        throw new Error("Loan schedule not found");
      }

      const penaltySchedule = await prisma.loanPenaltySchedule.create({
        data: {
          loanScheduleId: input.loanScheduleId,
          start: input.start,
          end: input.end,
          percentage: roundUpTo2Decimals(input.percentage),
          isExecuted: input.isExecuted || false,
          executedAt: input.executedAt,
        },
        include: {
          loanSchedule: {
            include: {
              loan: true,
            },
          },
        },
      });

      return { success: true, data: penaltySchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan penalty schedule by ID
   */
  async getLoanPenaltyScheduleById(penaltyScheduleId: string) {
    try {
      const penaltySchedule = await prisma.loanPenaltySchedule.findUnique({
        where: { id: penaltyScheduleId },
        include: {
          loanSchedule: {
            include: {
              loan: true,
            },
          },
        },
      });

      if (!penaltySchedule) {
        throw new Error("Loan penalty schedule not found");
      }

      return { success: true, data: penaltySchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all penalty schedules for a loan schedule
   */
  async getLoanPenaltySchedulesByScheduleId(scheduleId: string) {
    try {
      const penaltySchedules = await prisma.loanPenaltySchedule.findMany({
        where: { loanScheduleId: scheduleId },
        orderBy: { start: "asc" },
      });

      return { success: true, data: penaltySchedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan penalty schedule
   */
  async updateLoanPenaltySchedule(
    penaltyScheduleId: string,
    input: UpdateLoanPenaltyScheduleInput
  ) {
    try {
      const roundedInput: UpdateLoanPenaltyScheduleInput = {
        ...input,
        ...(input.percentage !== undefined && {
          percentage: roundUpTo2Decimals(input.percentage),
        }),
      };
      const penaltySchedule = await prisma.loanPenaltySchedule.update({
        where: { id: penaltyScheduleId },
        data: roundedInput,
      });

      return { success: true, data: penaltySchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute penalty schedule
   */
  async executeLoanPenaltySchedule(penaltyScheduleId: string) {
    try {
      const penaltySchedule = await prisma.loanPenaltySchedule.update({
        where: { id: penaltyScheduleId },
        data: {
          isExecuted: true,
          executedAt: new Date(),
        },
      });

      return {
        success: true,
        data: penaltySchedule,
        message: "Penalty schedule executed successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan penalty schedule
   */
  async deleteLoanPenaltySchedule(penaltyScheduleId: string) {
    try {
      const penaltySchedule = await prisma.loanPenaltySchedule.delete({
        where: { id: penaltyScheduleId },
      });

      return {
        success: true,
        data: penaltySchedule,
        message: "Loan penalty schedule deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending penalty schedules by date
   * Finds penalty schedules where the given date is between start and end dates and isExecuted is false
   */
  async getPendingPenaltySchedulesByDate(date: Date = new Date()) {
    try {
      const penaltySchedules = await prisma.loanPenaltySchedule.findMany({
        where: {
          isExecuted: false,
          start: {
            lte: normalizeToMidnight(date), // start date is less than or equal to the given date
          },
          end: {
            gte: normalizeToMidnight(date), // end date is greater than or equal to the given date
          },
        },
        include: {
          loanSchedule: {
            include: {
              loan: {
                include: {
                  buyer: {
                    select: {
                      id: true,
                      splitrId: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { start: "asc" },
      });

      return {
        success: true,
        data: penaltySchedules,
        count: penaltySchedules.length,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN PENALTY CRUD ====================

  /**
   * Create loan penalty
   */
  async createLoanPenalty(input: CreateLoanPenaltyInput) {
    try {
      const penalty = await prisma.loanPenalty.create({
        data: {
          dayAfter: input.dayAfter,
          percentage: roundUpTo2Decimals(input.percentage),
          status: input.status || LoanPenaltyStatus.Inactive,
        },
      });

      return { success: true, data: penalty };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan penalty by ID
   */
  async getLoanPenaltyById(penaltyId: string) {
    try {
      const penalty = await prisma.loanPenalty.findUnique({
        where: { id: penaltyId },
      });

      if (!penalty) {
        throw new Error("Loan penalty not found");
      }

      return { success: true, data: penalty };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all loan penalties
   */
  async getAllLoanPenalties(status?: LoanPenaltyStatus) {
    try {
      const where = status ? { status } : {};

      const penalties = await prisma.loanPenalty.findMany({
        where,
        orderBy: { dayAfter: "asc" },
      });

      return { success: true, data: penalties };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan penalty
   */
  async updateLoanPenalty(penaltyId: string, input: UpdateLoanPenaltyInput) {
    try {
      const roundedInput: UpdateLoanPenaltyInput = {
        ...input,
        ...(input.percentage !== undefined && {
          percentage: roundUpTo2Decimals(input.percentage),
        }),
      };
      const penalty = await prisma.loanPenalty.update({
        where: { id: penaltyId },
        data: roundedInput,
      });

      return { success: true, data: penalty };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan penalty
   */
  async deleteLoanPenalty(penaltyId: string) {
    try {
      const penalty = await prisma.loanPenalty.delete({
        where: { id: penaltyId },
      });

      return {
        success: true,
        data: penalty,
        message: "Loan penalty deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN DEBIT TRIAL CRUD ====================

  /**
   * Create loan debit trial
   */
  async createLoanDebitTrial(input: CreateLoanDebitTrialInput) {
    try {
      const debitTrial = await prisma.loanDebitTrial.create({
        data: {
          dayAfter: input.dayAfter,
          status: input.status || LoanPenaltyStatus.Inactive,
        },
      });

      return { success: true, data: debitTrial };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan debit trial by ID
   */
  async getLoanDebitTrialById(debitTrialId: string) {
    try {
      const debitTrial = await prisma.loanDebitTrial.findUnique({
        where: { id: debitTrialId },
      });

      if (!debitTrial) {
        throw new Error("Loan debit trial not found");
      }

      return { success: true, data: debitTrial };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all loan debit trials
   */
  async getAllLoanDebitTrials(status?: LoanPenaltyStatus) {
    try {
      const where = status ? { status } : {};

      const debitTrials = await prisma.loanDebitTrial.findMany({
        where,
        orderBy: { dayAfter: "asc" },
      });

      return { success: true, data: debitTrials };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan debit trial
   */
  async updateLoanDebitTrial(debitTrialId: string, input: UpdateLoanDebitTrialInput) {
    try {
      const debitTrial = await prisma.loanDebitTrial.update({
        where: { id: debitTrialId },
        data: input,
      });

      return { success: true, data: debitTrial };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan debit trial
   */
  async deleteLoanDebitTrial(debitTrialId: string) {
    try {
      const debitTrial = await prisma.loanDebitTrial.delete({
        where: { id: debitTrialId },
      });

      return {
        success: true,
        data: debitTrial,
        message: "Loan debit trial deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN DEBIT TRIAL SCHEDULE CRUD ====================

  /**
   * Create loan debit trial schedule
   */
  async createLoanDebitTrialSchedule(input: CreateLoanDebitTrialScheduleInput) {
    try {
      // Verify loan schedule exists
      const loanSchedule = await prisma.loanSchedule.findUnique({
        where: { id: input.loanScheduleId },
      });

      if (!loanSchedule) {
        throw new Error("Loan schedule not found");
      }

      const debitTrialSchedule = await prisma.loanDebitTrialSchedule.create({
        data: {
          loanScheduleId: input.loanScheduleId,
          start: input.start,
          end: input.end,
          isExecuted: input.isExecuted || false,
          executedAt: input.executedAt,
        },
        include: {
          loanSchedule: {
            include: {
              loan: true,
            },
          },
        },
      });

      return { success: true, data: debitTrialSchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan debit trial schedule by ID
   */
  async getLoanDebitTrialScheduleById(debitTrialScheduleId: string) {
    try {
      const debitTrialSchedule = await prisma.loanDebitTrialSchedule.findUnique({
        where: { id: debitTrialScheduleId },
        include: {
          loanSchedule: {
            include: {
              loan: true,
            },
          },
        },
      });

      if (!debitTrialSchedule) {
        throw new Error("Loan debit trial schedule not found");
      }

      return { success: true, data: debitTrialSchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all debit trial schedules for a loan schedule
   */
  async getLoanDebitTrialSchedulesByScheduleId(scheduleId: string) {
    try {
      const debitTrialSchedules = await prisma.loanDebitTrialSchedule.findMany({
        where: { loanScheduleId: scheduleId },
        orderBy: { start: "asc" },
      });

      return { success: true, data: debitTrialSchedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan debit trial schedule
   */
  async updateLoanDebitTrialSchedule(
    debitTrialScheduleId: string,
    input: UpdateLoanDebitTrialScheduleInput
  ) {
    try {
      const debitTrialSchedule = await prisma.loanDebitTrialSchedule.update({
        where: { id: debitTrialScheduleId },
        data: input,
      });

      return { success: true, data: debitTrialSchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute debit trial schedule
   */
  async executeLoanDebitTrialSchedule(debitTrialScheduleId: string) {
    try {
      const debitTrialSchedule = await prisma.loanDebitTrialSchedule.update({
        where: { id: debitTrialScheduleId },
        data: {
          isExecuted: true,
          executedAt: new Date(),
        },
      });

      return {
        success: true,
        data: debitTrialSchedule,
        message: "Debit trial schedule executed successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan debit trial schedule
   */
  async deleteLoanDebitTrialSchedule(debitTrialScheduleId: string) {
    try {
      const debitTrialSchedule = await prisma.loanDebitTrialSchedule.delete({
        where: { id: debitTrialScheduleId },
      });

      return {
        success: true,
        data: debitTrialSchedule,
        message: "Loan debit trial schedule deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN TRANSACTION CRUD ====================

  /**
   * Create loan transaction
   */
  async createLoanTransaction(input: CreateLoanTransactionInput) {
    const { creditAmount, debitAmount, loanId } = input;

    if (Math.abs(creditAmount) < 0.01 && Math.abs(debitAmount) < 0.01) {
      return null;
    }

    if (creditAmount > 0 && debitAmount > 0) {
      return {
        success: false,
        error: "Transaction not successful! credit and debit cannot be present at the same time",
      };
    }
    try {
      // Verify loan exists
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      const transaction = await prisma.loanTransaction.create({
        data: {
          splitrId: "", // Will be auto-generated by trigger
          loanId: input.loanId,
          transactionType: input.transactionType,
          transactionStatus: input.transactionStatus || TransactionStatus.Pending,
          description: input.description,
          creditAmount: roundUpTo2Decimals(input.creditAmount),
          debitAmount: roundUpTo2Decimals(input.debitAmount),
          transactionDate: input.transactionDate,
          scheduleId: input.scheduleId,
          transactReference: input.transactReference,
          paymentType: input.paymentType,
        },
        include: {
          loan: {
            select: {
              id: true,
              splitrId: true,
              loanAmount: true,
              buyer: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return { success: true, data: transaction };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN PAYMENT CRUD ====================

  /**
   * Create loan payment
   */
  async createLoanPayment(input: CreateLoanPaymentInput) {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: input.loanId },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      if (input.scheduleId) {
        const schedule = await prisma.loanSchedule.findUnique({
          where: { id: input.scheduleId },
        });
        if (!schedule || schedule.loanId !== input.loanId) {
          throw new Error("Loan schedule not found for this loan");
        }
      }

      const payment = await prisma.loanPayment.create({
        data: {
          loanId: input.loanId,
          credit: roundUpTo2Decimals(input.credit ?? 0),
          debit: roundUpTo2Decimals(input.debit ?? 0),
          principal:
            input.principal !== undefined ? roundUpTo2Decimals(input.principal) : undefined,
          interest: input.interest !== undefined ? roundUpTo2Decimals(input.interest) : undefined,
          penalty: input.penalty !== undefined ? roundUpTo2Decimals(input.penalty) : undefined,
          paymentType: input.paymentType,
          transactionReference: input.transactionReference,
          remarks: input.remarks,
          scheduleId: input.scheduleId,
        },
        include: {
          loan: {
            select: {
              id: true,
              splitrId: true,
              loanAmount: true,
            },
          },
          schedule: {
            select: {
              id: true,
              start: true,
              end: true,
              status: true,
            },
          },
        },
      });

      return { success: true, data: payment };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan transaction by ID
   */
  async getLoanTransactionById(transactionId: string) {
    try {
      const transaction = await prisma.loanTransaction.findUnique({
        where: { id: transactionId },
        include: {
          loan: {
            include: {
              buyer: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new Error("Loan transaction not found");
      }

      return { success: true, data: transaction };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan transaction by splitrId
   */
  async getLoanTransactionBysplitrId(splitrId: string) {
    try {
      const transaction = await prisma.loanTransaction.findUnique({
        where: { splitrId },
        include: {
          loan: {
            include: {
              buyer: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new Error("Loan transaction not found");
      }

      return { success: true, data: transaction };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all transactions for a loan
   */
  async getLoanTransactionsByLoanId(
    loanId: string,
    filters?: {
      transactionType?: TransactionType;
      transactionStatus?: TransactionStatus;
    }
  ) {
    try {
      const where: any = { loanId };
      if (filters?.transactionType) where.transactionType = filters.transactionType;
      if (filters?.transactionStatus) where.transactionStatus = filters.transactionStatus;

      const transactions = await prisma.loanTransaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
      });

      return { success: true, data: transactions };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all loan transactions with filters
   */
  async getAllLoanTransactions(filters?: {
    transactionType?: TransactionType;
    transactionStatus?: TransactionStatus;
    paymentType?: PaymentType;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.transactionType) where.transactionType = filters.transactionType;
      if (filters?.transactionStatus) where.transactionStatus = filters.transactionStatus;
      if (filters?.paymentType) where.paymentType = filters.paymentType;

      const [transactions, total] = await Promise.all([
        prisma.loanTransaction.findMany({
          where,
          skip,
          take: limit,
          include: {
            loan: {
              select: {
                id: true,
                splitrId: true,
                loanAmount: true,
                buyer: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { transactionDate: "desc" },
        }),
        prisma.loanTransaction.count({ where }),
      ]);

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan transaction
   */
  async updateLoanTransaction(transactionId: string, input: UpdateLoanTransactionInput) {
    try {
      const roundedInput: UpdateLoanTransactionInput = {
        ...input,
        ...(input.creditAmount !== undefined && {
          creditAmount: roundUpTo2Decimals(input.creditAmount),
        }),
        ...(input.debitAmount !== undefined && {
          debitAmount: roundUpTo2Decimals(input.debitAmount),
        }),
      };
      const transaction = await prisma.loanTransaction.update({
        where: { id: transactionId },
        data: roundedInput,
      });

      return { success: true, data: transaction };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete a transaction
   */
  async completeLoanTransaction(transactionId: string) {
    try {
      const transaction = await prisma.loanTransaction.update({
        where: { id: transactionId },
        data: {
          transactionStatus: TransactionStatus.Completed,
        },
      });

      return {
        success: true,
        data: transaction,
        message: "Transaction completed successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan transaction (restricted if linked to loan)
   */
  async deleteLoanTransaction(transactionId: string) {
    try {
      const transaction = await prisma.loanTransaction.delete({
        where: { id: transactionId },
      });

      return {
        success: true,
        data: transaction,
        message: "Loan transaction deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get loan summary
   */
  async getLoanSummary(loanId: string) {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
          buyer: true,
          loanSchedules: {
            include: {
              penaltySchedule: true,
            },
          },
          loanTransactions: true,
        },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      // Calculate totals
      const totalPaid = roundUpTo2Decimals(
        loan.loanTransactions
          .filter((t) => t.transactionStatus === TransactionStatus.Completed)
          .reduce((sum, t) => sum + Number(t.creditAmount), 0)
      );

      const totalPending = roundUpTo2Decimals(
        loan.loanTransactions
          .filter((t) => t.transactionStatus === TransactionStatus.Pending)
          .reduce((sum, t) => sum + Number(t.creditAmount), 0)
      );

      const scheduledPayments = loan.loanSchedules.length;
      const completedPayments = loan.loanSchedules.filter((s) => s.actualPayment).length;

      return {
        success: true,
        data: {
          loan,
          summary: {
            totalPaid,
            totalPending,
            scheduledPayments,
            completedPayments,
            remainingPayments: scheduledPayments - completedPayments,
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get buyer's loan history
   */
  async getBuyerLoanHistory(buyerId: string) {
    try {
      const loans = await prisma.loan.findMany({
        where: { buyerId },
        include: {
          loanTransactions: {
            where: {
              transactionStatus: TransactionStatus.Completed,
            },
          },
          loanSchedules: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: loans };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan balance grouped by transaction type
   * Calculates sum(creditAmount - debitAmount) for each transaction type
   */
  async getLoanBalanceByTransactionType(loanId: string) {
    try {
      // Verify loan exists
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      // Get all transactions for the loan
      const transactions = await prisma.loanTransaction.findMany({
        where: { loanId },
      });
      // Group by transaction type and calculate balance
      const balanceByType: Record<
        string,
        {
          transactionType: TransactionType;
          balance: number;
          totalCredit: number;
          totalDebit: number;
          transactionCount: number;
        }
      > = {};

      // Initialize all transaction types
      Object.values(TransactionType).forEach((type) => {
        balanceByType[type] = {
          transactionType: type,
          balance: 0,
          totalCredit: 0,
          totalDebit: 0,
          transactionCount: 0,
        };
      });

      // Calculate totals for each transaction type
      transactions.forEach((transaction) => {
        const type = transaction.transactionType;
        const credit = Number(transaction.creditAmount);
        const debit = Number(transaction.debitAmount);

        balanceByType[type].totalCredit += credit;
        balanceByType[type].totalDebit += debit;
        balanceByType[type].balance += credit - debit;
        balanceByType[type].transactionCount += 1;
      });

      // Convert to array and filter out types with no transactions
      const result = Object.values(balanceByType)
        .filter((item) => item.transactionCount > 0)
        .map((item) => ({
          ...item,
          balance: Math.max(0, roundUpTo2Decimals(item.balance) ?? 0),
          totalCredit: roundUpTo2Decimals(item.totalCredit) ?? 0,
          totalDebit: roundUpTo2Decimals(item.totalDebit) ?? 0,
        }));

      // Calculate overall balance
      const overallBalance = Math.max(
        0,
        roundUpTo2Decimals(result.reduce((sum, item) => sum + item.balance, 0)) ?? 0
      );
      const overallCredit = roundUpTo2Decimals(
        result.reduce((sum, item) => sum + item.totalCredit, 0)
      );
      const overallDebit = roundUpTo2Decimals(
        result.reduce((sum, item) => sum + item.totalDebit, 0)
      );

      return {
        success: true,
        data: {
          loanId,
          balanceByType: result,
          overall: {
            balance: overallBalance,
            totalCredit: overallCredit,
            totalDebit: overallDebit,
            transactionCount: transactions.length,
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getLoanBalanceByTransactionType2(loanId: string) {
    try {
      const balances = await prisma.$queryRaw<{ transactionType: string; balance: number }[]>`
        SELECT
          "transactionType",
          SUM("creditAmount" - "debitAmount") AS "balance"
        FROM "LoanTransaction"
        WHERE "loanId" = ${loanId}
        GROUP BY "transactionType"
      `;

      const overallBalance = Math.max(
        0,
        roundUpTo2Decimals(balances.reduce((sum, b) => sum + Number(b.balance), 0)) ?? 0
      );

      return {
        success: true,
        data: {
          loanId,
          balanceByType: balances.map((b) => ({
            transactionType: b.transactionType,
            balance: Math.max(0, roundUpTo2Decimals(Number(b.balance)) ?? 0),
          })),
          overall: {
            balance: overallBalance,
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async penaltyEnforcement(date: Date) {
    try {
      // interest enforcement
      await this.interestEnforcement(normalizeToMidnight(date));
      // First,re find the penalty schedules that need to be updated
      const penaltySchedules = await this.getPenaltySchedulesToUpdate(normalizeToMidnight(date));
      if (penaltySchedules.success) {
        const loanPenaltySchedules = penaltySchedules.data.penaltySchedules;
        for (const loanPenaltySchedule of loanPenaltySchedules) {
          const scheduleId = loanPenaltySchedule?.loanSchedule?.id;
          const schedulePenaltyTransactions =
            await this.getLoanTransactionsByScheduleId(scheduleId);
          // sum all the debit amount of the transactions
          const sumPayment = schedulePenaltyTransactions.reduce(
            (sum, transaction) => sum + Number(transaction.debitAmount),
            0
          );
          if (sumPayment >= loanPenaltySchedule.loanSchedule.loan.monthlyRepayment) {
            continue;
          }
          const loan = await this.getLoanById(loanPenaltySchedule.loanSchedule.loanId);

          if (loan.success && loan.data) {
            const loanData = loan.data;
            const balance = loanData.overallBalance;
            const expectedBalance = loanPenaltySchedule.expectedBalance;

            if (Number(balance) <= Number(expectedBalance)) {
              continue;
            }
            let penalty = roundUpTo2Decimals(
              (Number(balance) * Number(loanPenaltySchedule.percentage)) / 100
            );

            if (schedulePenaltyTransactions.length > 0) {
              //sum the debit amount of the transactions where the transaction type is penalty
              const schedulePenaltyDebitAmount = schedulePenaltyTransactions
                .filter((transaction) => transaction.transactionType === TransactionType.penalty)
                .reduce((sum, transaction) => sum + Number(transaction.creditAmount), 0);
              if (schedulePenaltyDebitAmount >= penalty) {
                continue;
              }
              penalty = roundUpTo2Decimals(penalty - schedulePenaltyDebitAmount);
            }

            await this.createLoanTransaction({
              loanId: loanData.id,
              scheduleId: loanPenaltySchedule?.loanSchedule?.id,
              transactionType: TransactionType.penalty,
              transactionStatus: TransactionStatus.Completed,
              creditAmount: penalty,
              debitAmount: 0,
              transactionDate: loanPenaltySchedule.start,
              description:
                " Penalty enforcement adjusted balance on" +
                balance.toFixed(2) +
                " on " +
                loanPenaltySchedule.start,
            });
          }
        }

        return { success: true, data: penaltySchedules.data };
      }
      return { success: false, error: "Failed to get penalty schedules" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async getPenaltySchedulesToUpdate(date: Date): Promise<{ success: boolean; data: any }> {
    try {
      const penaltySchedulesToUpdate = await prisma.loanPenaltySchedule.findMany({
        where: {
          start: { lte: new Date(date) },
          end: { gte: new Date(date) },
          isExecuted: false,
        },
        select: {
          id: true,
        },
        orderBy: {
          start: "asc",
        },
      });

      // Get IDs of schedules to update
      const scheduleIds = penaltySchedulesToUpdate.map((schedule) => schedule.id);

      // Update all matching schedules
      await prisma.loanPenaltySchedule.updateMany({
        where: {
          id: { in: scheduleIds },
        },
        data: {
          isExecuted: true,
          executedAt: new Date(),
        },
      });

      // Fetch the updated records
      const updatedPenaltySchedules = await prisma.loanPenaltySchedule.findMany({
        where: {
          id: { in: scheduleIds },
        },
        include: {
          loanSchedule: {
            include: {
              loan: {
                include: {
                  buyer: {
                    select: {
                      id: true,
                      splitrId: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          start: "asc",
        },
      });

      return {
        success: true,
        data: {
          count: updatedPenaltySchedules.length,
          penaltySchedules: updatedPenaltySchedules,
        },
      };
    } catch (error: any) {
      return { success: false, data: { count: 0, penaltySchedules: [] } };
    }
  }
  async interestEnforcement(date: Date) {
    try {
      const interestSchedules = await this.getInterestSchedulesToUpdate(normalizeToMidnight(date));

      if (interestSchedules.success) {
        const loanInterestSchedules = Array.isArray(interestSchedules.data)
          ? interestSchedules.data
          : [];

        for (const loanInterestSchedule of loanInterestSchedules) {
          const loan = await this.getLoanById(loanInterestSchedule.loanId);
          if (loan.success && loan.data) {
            const balance = Number(loan.data?.principalBalance);
            const installmentType = loan.data?.loanInstallmentType as LoanInstallmentType;
            await prisma.loanSchedule.update({
              where: { id: loanInterestSchedule.id },
              data: {
                openingBalance: roundUpTo2Decimals(balance),
              },
            });
            // const interest = balance * INTEREST_RATE * 0.01;
            let interest = 0;
            // if (installmentType === LoanInstallmentType.Monthly) {
            const scheduleStep = nextSchedule(
              Number(loan.data?.loanInterestRate),
              balance,
              Number(loan.data?.monthlyRepayment),
              installmentType
            );
            interest = scheduleStep.interest;
            // } else {
            //   interest = roundUpTo2Decimals(
            //     Math.min(Number(loan.data?.monthlyRepayment), balance) *
            //       Number(loan.data?.loanInterestRate) *
            //       0.01
            //   );
            // }

            await this.createLoanTransaction({
              loanId: loan.data.id,
              scheduleId: loanInterestSchedule.id,
              transactionType: TransactionType.interest,
              transactionStatus: TransactionStatus.Completed,
              creditAmount: interest,
              debitAmount: 0,
              transactionDate: loanInterestSchedule.start,
              description: "Interest enforcement on " + balance.toFixed(2) + " on " + date,
            });
          }
        }
        return {
          success: true,
          data: {
            count: loanInterestSchedules.length,
            interestSchedules: loanInterestSchedules,
          },
        };
      }
      return { success: false, error: "Failed to get interest schedules" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async getInterestSchedulesToUpdate(date: Date) {
    try {
      const interestSchedules = await prisma.loanSchedule.findMany({
        where: { start: { lte: date }, end: { gte: date }, isExecuted: false },
        include: {
          loan: {
            include: {
              buyer: true,
            },
          },
        },
      });

      await prisma.loanSchedule.updateMany({
        where: {
          id: { in: interestSchedules.map((schedule) => schedule.id) },
        },
        data: {
          isExecuted: true,
          executedAt: new Date(),
        },
      });
      return { success: true, data: interestSchedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async loanRepayment(loanId: string, amount: number, date: Date = new Date()) {
    try {
      // First, enforce penalties
      await this.penaltyEnforcement(date);
      const loan = await this.getLoanById(loanId);
      if (loan.success && loan.data) {
        const loanData = loan.data;
        const balance = loanData.overallBalance;
        if (amount > Number(balance)) {
          console.log("AMOUNT IS GREATER THAN BALANCE", amount, balance);
          return { success: false, error: "Amount is greater than balance" };
        }
        const principalRepayment = Number(loanData.principalBalance);
        const interestRepayment = Number(loanData.interestBalance);
        const penaltyRepayment = Number(loanData.penaltyBalance);

        const scheduleId = loanData.loanSchedules.filter(
          (schedule) => schedule.status === LoanScheduleStatus.Open
        )[0]?.id;
        let balanceAmount = roundUpTo2Decimals(Number(amount));
        if (penaltyRepayment > 0 && balanceAmount > 0) {
          const penaltyAmount = roundUpTo2Decimals(Math.min(balanceAmount, penaltyRepayment));
          balanceAmount = roundUpTo2Decimals(balanceAmount - penaltyAmount);
          await this.createLoanTransaction({
            loanId: loanData.id,
            scheduleId: scheduleId,
            transactionType: TransactionType.penalty,
            transactionStatus: TransactionStatus.Completed,
            creditAmount: 0,
            debitAmount: penaltyAmount,
            transactionDate: date,
            description: "Penalty repayment",
          });
        }
        if (interestRepayment > 0 && balanceAmount > 0) {
          const interestAmount = roundUpTo2Decimals(Math.min(balanceAmount, interestRepayment));
          balanceAmount = roundUpTo2Decimals(balanceAmount - interestAmount);
          await this.createLoanTransaction({
            loanId: loanData.id,
            scheduleId: scheduleId,
            transactionType: TransactionType.interest,
            transactionStatus: TransactionStatus.Completed,
            creditAmount: 0,
            debitAmount: interestAmount,
            transactionDate: date,
            description: "Interest repayment",
          });
        }
        if (principalRepayment > 0 && balanceAmount > 0) {
          const principalAmount = roundUpTo2Decimals(Math.min(balanceAmount, principalRepayment));
          balanceAmount = roundUpTo2Decimals(balanceAmount - principalAmount);
          await this.createLoanTransaction({
            loanId: loanData.id,
            scheduleId: scheduleId,
            transactionType: TransactionType.principal,
            transactionStatus: TransactionStatus.Completed,
            creditAmount: 0,
            debitAmount: principalAmount,
            transactionDate: date,
            description: "Principal repayment",
          });
        }
        if (loanData) {
          const loan = await this.getLoanById(loanData.id);
          if (loan.success && loan.data) {
            console.log("OVERALL BALANCE", Number(loan.data?.overallBalance));
            console.log("DATE", date);
            console.log("LOAN ID", loanData.id);
            await this.updateClosedSchedules(date, Number(loan.data?.overallBalance), loanData.id);
          }
        }
        await revenueService.createRevenue({
          type: RevenueType.Repayment,
          credit: roundUpTo2Decimals(Number(amount)),
          debit: 0,
          parentTable: "loan",
          description: "Loan repayment",
          referenceIds: [loanId],
          transactionDate: date,
          buyerId: loanData.buyerId,
        });
        return { success: true, data: { loanId, amount, date } };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async loanRepaymentSplitr({
    loanId,
    amount,
    date = new Date(),
    stripePaymentIntentId,
    paymentType = PaymentType.partial,
    isTest = false,
  }: {
    loanId: string;
    amount: number;
    date?: Date;
    stripePaymentIntentId: string;
    paymentType: PaymentType;
    isTest?: boolean;
  }) {
    try {
      const reference = randomUUID();
      // Check if the payment intent is succeeded
      if (!isTest) {
        const stripePaymentIntent = await stripeService.getPaymentIntent(stripePaymentIntentId);
        if (stripePaymentIntent.status !== "succeeded") {
          return { success: false, error: "Stripe payment intent is not succeeded" };
        }
        const paymentAmountCents = stripePaymentIntent.amount;

        if (paymentAmountCents !== Math.round(Number(amount) * 100)) {
          return { success: false, error: "Payment amount is not equal to the amount" };
        }
      }
      // First, enforce penalties

      // await this.penaltyEnforcement(date);

      let loan = await this.getLoanById(loanId);
      if (loan.success && loan.data) {
        let loanData = loan.data;
        const balance = loanData.liquidatingBalance;
        const amountCents = Math.round(Number(amount) * 100);
        const balanceCents = Math.round(Number(balance) * 100);
        if (amountCents > balanceCents + 30) {
          console.log("AMOUNT IS GREATER THAN BALANCE", amount, balance);
          return { success: false, error: "Amount is greater than balance" };
        }

        if (paymentType === PaymentType.full) {
          const liquidatingBalanceCents = Math.round(Number(loan.data.liquidatingBalance) * 100);
          if (amountCents + 30 < liquidatingBalanceCents) {
            return { success: false, error: "Amount is less than the liquidating balance" };
          }
          await directPayService.markValueSettled({
            stripePaymentIntentId,
            transactReference: reference,
            isTest,
          });

          this.createLoanPayment({
            loanId,
            credit: amount,
            debit: 0,
            principal: 0,
            interest: 0,
            penalty: 0,
            paymentType: PaymentType.credit,
            transactionReference: reference,
            remarks: `Full repayment of loan`,
          });
          await this.chargePartialRepaymentInterestAndAllocate({
            loanId,
            loanData,
            amount,
            date,
            transactReference: reference,
            description: "Interest charged on full repayment of loan",
            paymentType,
          });
        }
        if (paymentType === PaymentType.partial) {
          await directPayService.markValueSettled({
            stripePaymentIntentId,
            transactReference: reference,
            isTest,
          });
          this.createLoanPayment({
            loanId,
            credit: amount,
            debit: 0,
            principal: 0,
            interest: 0,
            penalty: 0,
            paymentType: PaymentType.credit,
            transactionReference: reference,
            remarks: `Partial repayment of loan`,
          });
          await this.chargePartialRepaymentInterestAndAllocate({
            loanId,
            loanData,
            amount,
            date,
            transactReference: reference,
            description: `Interest charged on ${paymentType} repayment of loan`,
            paymentType,
          });
        }

        const loanschedules = loanData.loanSchedules
          .filter((schedule) => schedule.status === LoanScheduleStatus.Open)
          .sort((a, b) => a.end.getTime() - b.end.getTime());

        if (paymentType === PaymentType.early) {
          const possibleSchedule = Math.floor(amount / Number(loanData.monthlyRepayment));
          const remainingAmount = roundUpTo2Decimals(
            amount - possibleSchedule * Number(loanData.monthlyRepayment)
          );
          console.log("FLOOR", Math.floor(amount / Number(loanData.monthlyRepayment)));
          console.log("POSSIBLE SCHEDULE", possibleSchedule);
          const settledPayment = await directPayService.markValueSettled({
            stripePaymentIntentId,
            transactReference: reference,
            isTest,
          });
          this.createLoanPayment({
            loanId,
            credit: amount,
            debit: 0,
            principal: 0,
            interest: 0,
            penalty: 0,
            paymentType: PaymentType.credit,
            transactionReference: reference,
            remarks: `Repayment of loan`,
          });
          for (let i = 0; i < possibleSchedule; i++) {
            await this.interestEnforcement(loanschedules[i].start);
            console.log(`${i + 1} Interest enforcement on ${loanschedules[i].start}`);
            const allocation = await this.allocateInterestAndPrincipalRepayment({
              loanId,
              amount: Number(loanData.monthlyRepayment),
              date: loanschedules[i].start,
              transactReference: settledPayment.transactReference,
              description: "Early repayment of loan",
              withschedule: true,
              paymentType,
            });
            loanData = allocation.loanData;
            if (loanData) {
              const loan = await this.getLoanById(loanData.id);
              if (loan.success && loan.data) {
                await this.updateClosedSchedules(
                  date,
                  Number(loan.data?.overallBalance),
                  loanData.id
                );
              }
            }
          }
          if (remainingAmount > 0.3) {
            await this.chargePartialRepaymentInterestAndAllocate({
              loanId,
              loanData,
              amount: remainingAmount,
              date,
              transactReference: reference,
              description: "Excess amount early repayment of loan",
              paymentType: PaymentType.partial,
            });
          }
        }

        await revenueService.createRevenue({
          type: RevenueType.Repayment,
          credit: roundUpTo2Decimals(Number(amount)),
          debit: 0,
          parentTable: "loan",
          description: "Loan repayment",
          referenceIds: [loanId],
          transactionDate: date,
          buyerId: loanData.buyerId,
        });
        return { success: true, data: { loanId, amount, date } };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Charge interest on a partial repayment, then allocate the repayment to interest/principal.
   */
  async chargePartialRepaymentInterestAndAllocate({
    loanId,
    loanData,
    amount,
    date = new Date(),
    transactReference,
    description,
    paymentType,
  }: {
    loanId: string;
    loanData: {
      id: string;
      loanInterestRate: unknown;
      loanInstallmentType: LoanInstallmentType;
      loanAmount: unknown;
    };
    amount: number;
    date?: Date;
    transactReference?: string;
    description: string;
    paymentType?: PaymentType;
  }) {
    const { loanInstallmentType } = loanData;
    let interest = 0;
    if (loanInstallmentType === LoanInstallmentType.Monthly) {
      interest = roundUpTo2Decimals(
        (Number(amount) * Number(loanData.loanInterestRate) * 0.01) / 12
      );
    } else {
      interest = flatRateInterestCalculation(
        Number(loanData.loanInterestRate),
        Number(amount)
      ).interest;
    }
    await this.createLoanTransaction({
      loanId: loanData.id,
      transactionType: TransactionType.interest,
      transactionStatus: TransactionStatus.Completed,
      creditAmount: interest,
      debitAmount: 0,
      transactionDate: date,
      description,
      transactReference,
      paymentType,
    });

    const allocation = await this.allocateInterestAndPrincipalRepayment({
      loanId,
      amount,
      date,
      transactReference,
      description,
      paymentType,
    });

    const loan = await this.getLoanById(loanId);
    if (!loan.success || !loan.data) {
      throw new Error(loan.error || "Loan not found");
    }
    const loanData2 = loan.data;
    const projectedSchedule = calculateSchedule(
      Number(loanData2.monthlyRepayment),
      Number(loanData2.principalBalance),
      Number(loanData2.loanInterestRate),
      loanData2.loanInstallmentType
    );

    // the the list of schedules and find the schedule that is open and update the schedule
    const schedules = loanData2.loanSchedules
      .filter((schedule) => schedule.status === LoanScheduleStatus.Open)
      .sort((a, b) => a.end.getTime() - b.end.getTime());
    if (schedules.length > 0) {
      for (let i = 0; i < schedules.length; i++) {
        console.log(` ${i} <= ${projectedSchedule.length - 1}`);
        const status =
          (i <= projectedSchedule.length - 1 ? (projectedSchedule[i].openingBalance ?? 0) : 0) <= 0
            ? LoanScheduleStatus.Closed
            : LoanScheduleStatus.Open;
        // update the opening and closing balance of the schedule and the closing balance of the schedule base on calculateSchedule
        await prisma.loanSchedule.update({
          where: { id: schedules[i].id },
          data: {
            openingBalance: roundUpTo2Decimals(
              i <= projectedSchedule.length - 1 ? (projectedSchedule[i].openingBalance ?? 0) : 0
            ),
            expectedBalance: roundUpTo2Decimals(
              i <= projectedSchedule.length - 1 ? (projectedSchedule[i].closingBalance ?? 0) : 0
            ),
            expectedPayment: roundUpTo2Decimals(
              i <= projectedSchedule.length - 1 ? (projectedSchedule[i].amountPay ?? 0) : 0
            ),
            expectedClosingBalance: roundUpTo2Decimals(
              i <= projectedSchedule.length - 1 ? (projectedSchedule[i].closingBalance ?? 0) : 0
            ),
            status: status,
          },
        });
      }
    }
    return {
      interestCharged: interest,
      ...allocation,
    };
  }

  /**
   * Allocate a repayment amount to outstanding interest, then principal.
   */
  async allocateInterestAndPrincipalRepayment({
    loanId,
    amount,
    date = new Date(),
    transactReference,
    description,
    withschedule = false,
    paymentType,
  }: {
    loanId: string;
    amount: number;
    date?: Date;
    transactReference?: string;
    description: string;
    withschedule?: boolean;
    paymentType?: PaymentType;
  }) {
    const loan = await this.getLoanById(loanId);
    if (!loan.success || !loan.data) {
      throw new Error(loan.error || "Loan not found");
    }

    const loanData = loan.data;
    const principalRepayment = Number(loanData.principalBalance);
    const interestRepayment = Number(loanData.interestBalance);
    const scheduleId = loanData.loanSchedules.filter(
      (schedule) => schedule.status === LoanScheduleStatus.Open
    )[0]?.id;

    let balanceAmount = roundUpTo2Decimals(Number(amount));
    let interestPaid = 0;
    let principalPaid = 0;

    if (interestRepayment > 0 && balanceAmount > 0) {
      const interestAmount = roundUpTo2Decimals(Math.min(balanceAmount, interestRepayment));
      balanceAmount = roundUpTo2Decimals(balanceAmount - interestAmount);
      interestPaid = interestAmount;
      await this.createLoanTransaction({
        loanId: loanData.id,
        scheduleId: withschedule ? scheduleId : undefined,
        transactionType: TransactionType.interest,
        transactionStatus: TransactionStatus.Completed,
        creditAmount: 0,
        debitAmount: interestAmount,
        transactionDate: date,
        description: `${description} - Interest repayment`,
        transactReference,
        paymentType,
      });
    }

    if (principalRepayment > 0 && balanceAmount > 0) {
      const principalAmount = roundUpTo2Decimals(Math.min(balanceAmount, principalRepayment));
      balanceAmount = roundUpTo2Decimals(balanceAmount - principalAmount);
      principalPaid = principalAmount;
      await this.createLoanTransaction({
        loanId: loanData.id,
        scheduleId: withschedule ? scheduleId : undefined,
        transactionType: TransactionType.principal,
        transactionStatus: TransactionStatus.Completed,
        creditAmount: 0,
        debitAmount: principalAmount,
        transactionDate: date,
        description: `${description} - Principal repayment`,
        transactReference,
        paymentType,
      });
    }

    if (paymentType) {
      await this.createLoanPayment({
        loanId,
        scheduleId: withschedule ? scheduleId : undefined,
        credit: 0,
        debit: amount,
        principal: principalPaid,
        interest: interestPaid,
        penalty: 0,
        paymentType,
        transactionReference: transactReference ?? "",
        remarks: description,
      });
    }

    return {
      loanData,
      scheduleId,
      interestPaid,
      principalPaid,
      remainingAmount: balanceAmount,
    };
  }

  async updateClosedSchedules(date: Date, balance: number, loanId: string): Promise<void> {
    const adjustedBalance = balance - 0.00999;
    const closedSchedules = await prisma.loanSchedule.updateMany({
      where: {
        loanId: loanId, // (loanId = loanId)
        OR: [
          { end: { lte: date } }, // (end <= date)
          { expectedClosingBalance: { gte: adjustedBalance } }, // (expectedBalance >= balance)
        ],
      },
      data: {
        isExecuted: true,
        executedAt: new Date(),
        status: LoanScheduleStatus.Closed,
      },
    });

    return;
  }
  async getLoanTransactionsByScheduleId(scheduleId: string) {
    return await prisma.loanTransaction.findMany({
      where: { scheduleId: scheduleId },
    });
  }

  async getLoanCountsByStatus() {
    try {
      const counts = await prisma.loan.groupBy({
        by: ["loanStatus"],
        _count: {
          loanStatus: true,
        },
        orderBy: {
          loanStatus: "asc",
        },
      });

      // Transform the result into a more readable format
      const countsByStatus = counts.map((item) => ({
        status: item.loanStatus,
        count: item._count.loanStatus,
      }));

      // Calculate total
      const total = countsByStatus.reduce((sum, item) => sum + item.count, 0);

      return {
        success: true,
        data: {
          countsByStatus,
          total,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get total loans created within a date range
   */
  async getLoansCreatedByDateRange(startDate: Date, endDate: Date) {
    try {
      // Validate dates
      if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
      }

      if (startDate > endDate) {
        throw new Error("Start date must be before or equal to end date");
      }

      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Get total count
      const totalCount = await prisma.loan.count({ where });

      // Get counts grouped by status
      const countsByStatus = await prisma.loan.groupBy({
        by: ["loanStatus"],
        where,
        _count: {
          loanStatus: true,
        },
      });

      // Get loans with basic info
      const loans = await prisma.loan.findMany({
        where,
        select: {
          id: true,
          splitrId: true,
          loanAmount: true,
          loanStatus: true,
          loanType: true,
          createdAt: true,
          buyer: {
            select: {
              id: true,
              splitrId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          merchant: {
            select: {
              id: true,
              splitrId: true,
              businessName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Calculate total loan amount
      const totalLoanAmount = roundUpTo2Decimals(
        loans.reduce((sum, loan) => sum + Number(loan.loanAmount), 0)
      );

      return {
        success: true,
        data: {
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          totalCount,
          totalLoanAmount,
          countsByStatus: countsByStatus.map((item) => ({
            status: item.loanStatus,
            count: item._count.loanStatus,
          })),
          loans,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loans count grouped by day within a date range
   */
  async getLoansCountGroupedByDay(startDate: Date, endDate: Date) {
    try {
      // Validate dates
      if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
      }

      if (startDate > endDate) {
        throw new Error("Start date must be before or equal to end date");
      }

      // Get all loans in the date range
      const loans = await prisma.loan.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
          loanAmount: true,
        },
      });

      // Create a map to store counts and amounts by date
      const dataByDate = new Map<string, { count: number; totalAmount: number }>();

      // Generate all dates in the range
      const currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);
      const endDateNormalized = new Date(endDate);
      endDateNormalized.setHours(23, 59, 59, 999);

      // Initialize all dates with 0 count and 0 amount
      while (currentDate <= endDateNormalized) {
        const dateKey = currentDate.toISOString().split("T")[0];
        dataByDate.set(dateKey, { count: 0, totalAmount: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count loans and sum amounts for each date
      loans.forEach((loan) => {
        const dateKey = loan.createdAt.toISOString().split("T")[0];
        const currentData = dataByDate.get(dateKey) || {
          count: 0,
          totalAmount: 0,
        };
        dataByDate.set(dateKey, {
          count: currentData.count + 1,
          totalAmount: roundUpTo2Decimals(currentData.totalAmount + Number(loan.loanAmount)) ?? 0,
        });
      });

      // Convert map to array
      const countsByDay = Array.from(dataByDate.entries()).map(([date, data]) => ({
        date,
        count: data.count,
        totalAmount: roundUpTo2Decimals(data.totalAmount) ?? 0,
      }));

      // Calculate totals
      const totalCount = loans.length;
      const totalLoanAmount = roundUpTo2Decimals(
        loans.reduce((sum, loan) => sum + Number(loan.loanAmount), 0)
      );

      return {
        success: true,
        data: {
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          totalCount,
          totalLoanAmount,
          countsByDay,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async processLoanRepayment(loanId: string, date: Date) {
    try {
      const reference = generateShortReferenceId();
      const loan = await this.getLoanById(loanId);
      if (!loan.success || !loan.data) {
        return { success: false, error: "Loan not found" };
      }
      const loanData = loan.data;
      const amountDue = loanData.amountDue;

      if (amountDue <= 0) {
        return { success: false, error: "Amount due is less than 0" };
      }
      // get invoiceMandate by invoice id
      const invoiceMandates = await invoiceMandateService.getMandatesByInvoiceId(
        loanData.invoiceId as string
      );
      if (!invoiceMandates) {
        return { success: false, error: "Invoice mandates not found" };
      }
      const invoiceMandate = invoiceMandates[0];
      if (!invoiceMandate) {
        return { success: false, error: "Invoice mandate not found" };
      }
      const invoiceMandateData = invoiceMandate;
      // perform debit on the invoice mandate
      const validatedAmount = roundUpTo2Decimals(
        Math.min(amountDue, Number(invoiceMandateData.amount))
      );
      const createdMandateDebit = await mandateDebitService.create({
        invoiceId: loanData.invoiceId as string,
        loanId: loanId,
        mandateId: invoiceMandateData.id,
        reference: reference,
        amount: validatedAmount * 100,
        transactionDate: date,
        status: TransactionStatus.Pending,
      });
      const debitResult = await accountDetailsService.debitMonoMandate(
        invoiceMandateData.monoMandateId as string,
        validatedAmount * 100,
        reference,
        `Loan repayment for ${loanData.buyer.firstName} ${loanData.buyer.lastName}-loanId: ${loanData.splitrId}`
      );

      console.log({
        reference: reference,
        debitResult: debitResult,
        validatedAmount: validatedAmount,
        mandateId: invoiceMandateData.monoMandateId,
      });
      if (!debitResult.success) {
        return { success: false, error: debitResult.error };
      }
      await mandateDebitService.getByMandateIdAndReference(invoiceMandateData.id, reference);
      // if (!mandateDebit) {
      //   return { success: false, error: 'Mandate debit not found' };
      // }
      // if (mandateDebit.data.status === T) {
      //   return { success: false, error: 'Mandate debit is pending' };
      // }
      // if (mandateDebit.status === TransactionStatus.Completed) {
      //   return { success: false, error: 'Mandate debit is completed' };
      // }
      mandateDebitService.update(createdMandateDebit.data.id, {
        status: TransactionStatus.Completed,
      });
      await this.loanRepayment(loanId, validatedAmount, date);
      return { success: true, data: validatedAmount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async initiateLoanRepayment(loanId: string, amount: number) {
    const reference = generateShortReferenceId();
    try {
      const date = new Date();
      // First, enforce penalties
      const loan = await this.getLoanById(loanId);
      if (loan.success && loan.data) {
        const loanData = loan.data;
        const invoiceId = loanData.invoiceId;
        if (!invoiceId) {
          return { success: false, error: "Invoice ID not found" };
        }
        const invoiceMandates = await invoiceMandateService.getMandatesByInvoiceId(invoiceId);

        if (!invoiceMandates || invoiceMandates?.length === 0) {
          throw new Error("Mandate not found");
        }

        const invoiceMandate = invoiceMandates[0];
        const mandateBuyerId = invoiceMandate.buyerId;
        const mandateMonoAccountId = invoiceMandate.monoAccountId;
        const mandateMonoCustomerId = invoiceMandate.monoCustomerId;
        if (!mandateMonoAccountId || !mandateMonoCustomerId) {
          throw new Error("Mono account/customer ID not found on mandate");
        }
        const buyer = await buyerService.getBuyerById(mandateBuyerId);
        if (!buyer) {
          throw new Error("Buyer not found");
        }
        // ensure amount is rounded up to 2 decimal places
        const formattedAmount = roundUpTo2Decimals(amount);
        const directPay = await directPayService.initiateMonoDirectPay({
          amount: formattedAmount * 100,
          customerId: mandateMonoCustomerId,
          reference: reference,
          // account: mandateMonoAccountId,
          redirectUrl: `${process.env.FRONTEND_URL}/buyer/dashboard/direct-pay/loan-repayment`,
          description: `Loan repayment for ${loanData.buyer.firstName} ${loanData.buyer.lastName}-loanId: ${loanData.splitrId}`,
          customer: {
            email: buyer.email,
            phone: buyer.phoneNumber || "",
            address: buyer.address || "",
            identity: {
              type: "bvn",
              number: buyer.sinNumber || buyer.idNumber || "",
            },
            name: `${buyer.firstName} ${buyer.lastName}`,
          },
        });
        if (!directPay.success) {
          throw new Error("Failed to initiate loan repayment");
        }
        // create direct pay
        const createdDirectPay = await directPayService.createDirectPay({
          invoiceId: invoiceId,
          mandateId: invoiceMandate.id,
          amount: formattedAmount,
          buyerId: mandateBuyerId,
          monoCustomerId: mandateMonoCustomerId,
          reference: reference,
          monoAccountId: mandateMonoAccountId,
          monoUrl: directPay.data.data.mono_url,
          status: DirectPayStatus.Pending,
          type: DirectPayType.LoanRepayment,
          paymentMedium: PaymentProvider.Mono,
        });
        return { success: true, monoUrl: directPay.data.data.mono_url };

        // perform debit on the invoice mandate
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async initiateLoanRepaymentStripe(loanId: string, amount: number) {
    const reference = generateShortReferenceId();
    try {
      const loan = await this.getLoanById(loanId);
      if (!loan.success || !loan.data) {
        return { success: false, error: loan.error || "Loan not found" };
      }

      const loanData = loan.data;
      const invoiceId = loanData.invoiceId;
      if (!invoiceId) {
        return { success: false, error: "Invoice ID not found" };
      }

      const buyer = await buyerService.getBuyerById(loanData.buyerId);
      if (!buyer) {
        throw new Error("Buyer not found");
      }

      const formattedAmount = roundUpTo2Decimals(amount);
      const amountCents = Math.round(formattedAmount * 100);
      const paymentIntent = await stripeService.createPaymentIntent({
        amount: amountCents,
        description: `Loan repayment for ${loanData.buyer.firstName} ${loanData.buyer.lastName}-loanId: ${loanData.splitrId}`,
        purpose: "LoanRepayment",
        reference,
        buyerId: buyer.id,
        loanId,
        invoiceId,
        metadata: {
          loanId,
          invoiceId,
          reference,
          buyerId: buyer.id,
        },
      });

      const createdDirectPay = await directPayService.createDirectPay({
        invoiceId,
        amount: formattedAmount,
        buyerId: buyer.id,
        reference,
        status: DirectPayStatus.Pending,
        type: DirectPayType.LoanRepayment,
        paymentMedium: PaymentProvider.Stripe,
        stripePaymentIntentId: paymentIntent.paymentIntentId,
        stripePaymentIntentStatus: paymentIntent.status,
        stripePaymentIntentClientSecret: paymentIntent.clientSecret ?? undefined,
      });

      return {
        success: true,
        data: {
          directPay: createdDirectPay,
          reference,
          paymentIntentId: paymentIntent.paymentIntentId,
          clientSecret: paymentIntent.clientSecret,
          status: paymentIntent.status,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async validateLoanRepayment(referenceid: string, paymentType: PaymentType = PaymentType.full) {
    const directPay = await directPayService.getDirectPayByReference(referenceid);

    if (!directPay || !directPay.id) {
      return { success: false, error: "Direct pay not found" };
    }
    if (directPay.status === DirectPayStatus.Completed) {
      console.log("DIRECT PAY COMPLETED", directPay);
      return { success: true, data: directPay };
    }

    const loan = await this.getLoanByInvoiceId(directPay.invoiceId);
    if (!loan.success || !loan.data) {
      return { success: false, error: "Loan not found" };
    }
    const loanData = loan.data;
    const loanId = loanData.id;
    const amount = Number(directPay.amount);
    const date = new Date();

    const isStripe =
      directPay.paymentMedium === PaymentProvider.Stripe || !!directPay.stripePaymentIntentId;

    if (isStripe) {
      if (!directPay.stripePaymentIntentId) {
        return { success: false, error: "Stripe payment intent not found for this direct pay" };
      }

      const paymentIntent = await stripeService.getPaymentIntent(directPay.stripePaymentIntentId);
      await directPayService.updateDirectPay(directPay.id, {
        stripePaymentIntentStatus: paymentIntent.status,
      });

      if (paymentIntent.status !== "succeeded") {
        return {
          success: false,
          error: `Stripe payment not completed. Current status: ${paymentIntent.status}`,
        };
      }

      const updatedDirectPay = await directPayService.updateDirectPay(directPay.id, {
        status: DirectPayStatus.Completed,
        stripePaymentIntentStatus: paymentIntent.status,
      });

      if (!updatedDirectPay) {
        return { success: false, error: "Failed to update direct pay" };
      }
      console.log("LOAN REPAYMENT", loanId, amount, date);
      await this.loanRepaymentSplitr({
        loanId,
        amount,
        date,
        stripePaymentIntentId: directPay.stripePaymentIntentId,
        paymentType: paymentType,
      });
      return { success: true, data: updatedDirectPay };
    }

    const result = await directPayService.verifyMonoDirectPay(referenceid);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    console.log("MONO PAYMENT VERIFIED", result);
    //update direct pay status to completed
    if (result.data.status === "successful") {
      const updatedDirectPay = await directPayService.updateDirectPay(directPay.id, {
        status: DirectPayStatus.Completed,
      });
      if (!updatedDirectPay) {
        return { success: false, error: "Failed to update direct pay" };
      }

      await this.loanRepayment(loanId, amount, date);
      return { success: true, data: updatedDirectPay };
    }

    return { success: false, error: "Failed to validate loan repayment" };
  }
}
export const loanService = new LoanService();
