import { Prisma, TransactionStatus } from '@prisma/client';
import prisma from '../utils/prisma';

export interface CreateMandateDebitInput {
  invoiceId?: string | null;
  loanId?: string | null;
  mandateId: string;
  reference: string;
  amount: number;
  transactionDate: string | Date;
  status?: TransactionStatus;
}

export interface UpdateMandateDebitInput {
  invoiceId?: string | null;
  loanId?: string | null;
  mandateId?: string;
  reference?: string;
  amount?: number;
  transactionDate?: string | Date;
  status?: TransactionStatus;
}

const mandateDebitSelect = {
  id: true,
  invoiceId: true,
  loanId: true,
  mandateId: true,
  reference: true,
  amount: true,
  transactionDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toNumber(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeRecord(row: any) {
  return {
    ...row,
    amount: toNumber(row.amount),
  };
}

export class MandateDebitService {
  async create(input: CreateMandateDebitInput) {
    if (input.invoiceId) {
      const inv = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
      if (!inv) throw new Error('Invoice not found');
    }
    if (input.loanId) {
      const loan = await prisma.loan.findUnique({ where: { id: input.loanId } });
      if (!loan) throw new Error('Loan not found');
    }

    const row = await prisma.mandateDebit.create({
      data: {
        invoiceId: input.invoiceId ?? null,
        loanId: input.loanId ?? null,
        mandateId: input.mandateId,
        reference: input.reference,
        amount: new Prisma.Decimal(input.amount),
        transactionDate:
          input.transactionDate instanceof Date
            ? input.transactionDate
            : new Date(input.transactionDate),
        status: input.status ?? TransactionStatus.Pending,
      },
      select: mandateDebitSelect,
    });

    return {
      success: true,
      message: 'Mandate debit created successfully',
      data: normalizeRecord(row),
    };
  }

  async list(filter?: {
    invoiceId?: string;
    loanId?: string;
    mandateId?: string;
    reference?: string;
    status?: TransactionStatus;
  }) {
    const where: Prisma.MandateDebitWhereInput = {};
    if (filter?.invoiceId) where.invoiceId = filter.invoiceId;
    if (filter?.loanId) where.loanId = filter.loanId;
    if (filter?.mandateId) where.mandateId = filter.mandateId;
    if (filter?.reference) where.reference = filter.reference;
    if (filter?.status) where.status = filter.status;

    const rows = await prisma.mandateDebit.findMany({
      where,
      select: mandateDebitSelect,
      orderBy: { transactionDate: 'desc' },
    });

    return {
      success: true,
      message: 'Mandate debits retrieved successfully',
      data: rows.map(normalizeRecord),
    };
  }

  async getById(id: string) {
    const row = await prisma.mandateDebit.findUnique({
      where: { id },
      select: mandateDebitSelect,
    });
    if (!row) throw new Error('Mandate debit not found');

    return {
      success: true,
      message: 'Mandate debit retrieved successfully',
      data: normalizeRecord(row),
    };
  }

  async getByMandateIdAndReference(mandateId: string, reference: string) {
    const row = await prisma.mandateDebit.findUnique({
      where: { mandateId_reference: { mandateId, reference } },
      select: mandateDebitSelect,
    });
    if (!row) throw new Error('Mandate debit not found');

    return {
      success: true,
      message: 'Mandate debit retrieved successfully',
      data: normalizeRecord(row),
    };
  }

  async update(id: string, input: UpdateMandateDebitInput) {
    const existing = await prisma.mandateDebit.findUnique({ where: { id } });
    if (!existing) throw new Error('Mandate debit not found');

    if (input.invoiceId !== undefined && input.invoiceId !== null) {
      const inv = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
      if (!inv) throw new Error('Invoice not found');
    }
    if (input.loanId !== undefined && input.loanId !== null) {
      const loan = await prisma.loan.findUnique({ where: { id: input.loanId } });
      if (!loan) throw new Error('Loan not found');
    }

    const data: Prisma.MandateDebitUpdateInput = {};
    if (input.invoiceId !== undefined)
      data.invoice = input.invoiceId ? { connect: { id: input.invoiceId } } : { disconnect: true };
    if (input.loanId !== undefined)
      data.loan = input.loanId ? { connect: { id: input.loanId } } : { disconnect: true };
    if (input.mandateId !== undefined) data.mandateId = input.mandateId;
    if (input.reference !== undefined) data.reference = input.reference;
    if (input.amount !== undefined) data.amount = new Prisma.Decimal(input.amount);
    if (input.transactionDate !== undefined)
      data.transactionDate =
        input.transactionDate instanceof Date
          ? input.transactionDate
          : new Date(input.transactionDate);
    if (input.status !== undefined) data.status = input.status;

    const row = await prisma.mandateDebit.update({
      where: { id },
      data,
      select: mandateDebitSelect,
    });

    return {
      success: true,
      message: 'Mandate debit updated successfully',
      data: normalizeRecord(row),
    };
  }

  async remove(id: string) {
    const existing = await prisma.mandateDebit.findUnique({ where: { id } });
    if (!existing) throw new Error('Mandate debit not found');

    await prisma.mandateDebit.delete({ where: { id } });

    return {
      success: true,
      message: 'Mandate debit deleted successfully',
    };
  }
}

export const mandateDebitService = new MandateDebitService();
