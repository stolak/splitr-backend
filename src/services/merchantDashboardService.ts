import {
  FulfillStatus,
  InvoiceStatus,
  LoanReturnStatus,
  LoanStatus,
  Prisma,
  ProductType,
  ReserveStatus,
  SettlementRecordType,
} from "@prisma/client";
import prisma from "../utils/prisma";
import { roundUpTo2Decimals } from "../utils/helper";
import { nextSettlementScheduleService } from "./nextSettlementScheduleService";

const APPROVED_LOAN_STATUSES: LoanStatus[] = [
  LoanStatus.Approved,
  LoanStatus.Active,
  LoanStatus.Complete,
  LoanStatus.Pause,
  LoanStatus.Default,
];

const RECENT_TRANSACTION_LIMIT = 10;

type PaidInvoice = {
  amount: Prisma.Decimal;
  createdAt: Date;
  buyerId: string | null;
  customerEmail: string;
  category: { name: string } | null;
  productType: ProductType;
  loan: {
    loanStatus: LoanStatus;
    loanTenure: number;
    product: { productName: string; productType: ProductType; tenure: number } | null;
  } | null;
};

function money(value: Prisma.Decimal | number | null | undefined): number {
  return roundUpTo2Decimals(Number(value ?? 0)) ?? 0;
}

function changePercent(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null;
  return money(((current - prior) / prior) * 100);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
}

function addUtcMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const next = new Date(Date.UTC(year, month + months, day));
  const expectedMonth = (((month + months) % 12) + 12) % 12;
  if (next.getUTCMonth() !== expectedMonth) {
    return new Date(Date.UTC(year, month + months + 1, 0));
  }
  return next;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
}

function customerKey(buyerId: string | null, email: string): string {
  if (buyerId) return `buyer:${buyerId}`;
  return `email:${email.trim().toLowerCase()}`;
}

function inRange(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function purchaseStatusLabel(status: InvoiceStatus): string {
  if (status === InvoiceStatus.Paid) return "Paid";
  if (status === InvoiceStatus.Pending) return "Awaiting purchase";
  return status;
}

function fulfilmentStatusLabel(status: FulfillStatus): string {
  if (status === FulfillStatus.Fulfilled) return "Fulfilled";
  if (status === FulfillStatus.Pending) return "Not started";
  if (status === FulfillStatus.AwaitingFulfillment) return "Awaiting fulfilment";
  return status;
}

function productLabel(invoice: {
  productType: ProductType;
  loan: {
    loanTenure: number;
    product: { productName: string; productType: ProductType; tenure: number } | null;
  } | null;
}): string {
  if (invoice.loan?.product?.productName) return invoice.loan.product.productName;
  const tenure = invoice.loan?.loanTenure;
  const type = invoice.loan?.product?.productType ?? invoice.productType;
  if (type === ProductType.MONTHLY_FLEX) {
    return tenure ? `Monthly Flex (${tenure})` : "Monthly Flex";
  }
  if (tenure === 4) return "Pay-in-4";
  if (tenure === 6) return "Pay-in-6";
  return tenure ? `Pay-in-${tenure}` : "Pay-in-4";
}

function productGroup(invoice: PaidInvoice): { key: string; label: string } {
  const type = invoice.loan?.product?.productType ?? invoice.productType;
  const tenure = invoice.loan?.product?.tenure ?? invoice.loan?.loanTenure;
  if (type === ProductType.MONTHLY_FLEX) return { key: "monthlyFlex", label: "Monthly Flex" };
  if (tenure === 6) return { key: "payIn6", label: "Pay-in-6 (P6)" };
  if (tenure === 4 || type === ProductType.BI_WEEKLY)
    return { key: "payIn4", label: "Pay-in-4 (P4)" };
  return { key: "other", label: "Other" };
}

function sumAmounts(invoices: PaidInvoice[]): number {
  return money(invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0));
}

function approvalRate(invoices: { loan: { loanStatus: LoanStatus } | null }[]): number | null {
  let approved = 0;
  let declined = 0;
  for (const invoice of invoices) {
    const status = invoice.loan?.loanStatus;
    if (!status || status === LoanStatus.Pending) continue;
    if (APPROVED_LOAN_STATUSES.includes(status)) approved += 1;
    else if (status === LoanStatus.Cancel) declined += 1;
  }
  const decided = approved + declined;
  if (decided === 0) return null;
  return money((approved / decided) * 100);
}

export class MerchantDashboardService {
  async getDashboard(input: {
    merchantId: string;
    outletId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: input.merchantId },
      select: { id: true, businessName: true },
    });
    if (!merchant) throw new Error("Merchant not found");

    if (input.outletId) {
      const outlet = await prisma.outlet.findUnique({
        where: { id: input.outletId },
        select: { id: true, merchantId: true },
      });
      if (!outlet) throw new Error("Outlet not found");
      if (outlet.merchantId !== merchant.id)
        throw new Error("Outlet does not belong to this merchant");
    }

    const today = new Date();
    const endDate = input.endDate ? endOfUtcDay(input.endDate) : endOfUtcDay(today);
    const startDate = input.startDate
      ? startOfUtcDay(input.startDate)
      : startOfUtcDay(addUtcMonths(today, -1));
    if (startDate.getTime() > endDate.getTime()) {
      throw new Error("startDate must be on or before endDate");
    }

    const rangeMs = endDate.getTime() - startDate.getTime();
    const priorEnd = new Date(startDate.getTime() - 1);
    const priorStart = new Date(startDate.getTime() - rangeMs);
    const endMonth = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1));
    const chartThisStart = addUtcMonths(endMonth, -5);
    const chartPreviousStart = addUtcMonths(chartThisStart, -6);
    const historyStart = new Date(Math.min(priorStart.getTime(), chartPreviousStart.getTime()));

    const outletFilter = input.outletId ? { outletId: input.outletId } : {};
    const invoiceWhere = { merchantId: merchant.id, ...outletFilter };

    const [
      outlets,
      paidInvoices,
      priorCustomers,
      rangeInvoices,
      pendingInvoices,
      awaitingFulfilment,
      returnRequests,
      disputesRequiringResponse,
      disputesInRange,
      unsettledSettlements,
      latestSettled,
      reserved,
      nextSchedule,
    ] = await Promise.all([
      prisma.outlet.findMany({
        where: { merchantId: merchant.id },
        select: { id: true, outletName: true, code: true, status: true },
        orderBy: { outletName: "asc" },
      }),
      prisma.invoice.findMany({
        where: {
          ...invoiceWhere,
          status: InvoiceStatus.Paid,
          createdAt: { gte: historyStart, lte: endDate },
        },
        select: {
          amount: true,
          createdAt: true,
          buyerId: true,
          customerEmail: true,
          productType: true,
          category: { select: { name: true } },
          loan: {
            select: {
              loanStatus: true,
              loanTenure: true,
              product: { select: { productName: true, productType: true, tenure: true } },
            },
          },
        },
      }),
      prisma.invoice.findMany({
        where: {
          ...invoiceWhere,
          status: InvoiceStatus.Paid,
          createdAt: { lt: priorStart },
        },
        select: { buyerId: true, customerEmail: true },
      }),
      prisma.invoice.findMany({
        where: { ...invoiceWhere, createdAt: { gte: priorStart, lte: endDate } },
        select: {
          id: true,
          splitrId: true,
          createdAt: true,
          customerName: true,
          amount: true,
          status: true,
          fulfillStatus: true,
          returnStatus: true,
          productType: true,
          loan: {
            select: {
              splitrId: true,
              loanStatus: true,
              loanTenure: true,
              product: { select: { productName: true, productType: true, tenure: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.count({ where: { ...invoiceWhere, status: InvoiceStatus.Pending } }),
      prisma.invoice.count({
        where: {
          ...invoiceWhere,
          status: InvoiceStatus.Paid,
          fulfillStatus: { in: [FulfillStatus.Pending, FulfillStatus.AwaitingFulfillment] },
        },
      }),
      prisma.invoice.count({ where: { ...invoiceWhere, returnStatus: LoanReturnStatus.Pending } }),
      prisma.settlement.count({
        where: {
          merchantId: merchant.id,
          ...outletFilter,
          isSettled: false,
          settlementRecordType: SettlementRecordType.Dispute,
        },
      }),
      prisma.settlement.count({
        where: {
          merchantId: merchant.id,
          ...outletFilter,
          settlementRecordType: SettlementRecordType.Dispute,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.settlement.findMany({
        where: { merchantId: merchant.id, ...outletFilter, isSettled: false },
        select: { credit: true, debit: true },
      }),
      prisma.settlement.findFirst({
        where: {
          merchantId: merchant.id,
          ...outletFilter,
          isSettled: true,
          settledDate: { not: null },
        },
        orderBy: { settledDate: "desc" },
        select: { batchReference: true, settledDate: true },
      }),
      prisma.merchantReserveRelease.aggregate({
        where: {
          merchantId: merchant.id,
          ...outletFilter,
          reserveStatus: ReserveStatus.RESERVED,
        },
        _sum: { amount: true },
      }),
      nextSettlementScheduleService.get(),
    ]);

    const currentInvoices = rangeInvoices.filter((invoice) =>
      inRange(invoice.createdAt, startDate, endDate)
    );
    const priorInvoices = rangeInvoices.filter((invoice) =>
      inRange(invoice.createdAt, priorStart, priorEnd)
    );
    const currentPaid = paidInvoices.filter((invoice) =>
      inRange(invoice.createdAt, startDate, endDate)
    );
    const priorPaid = paidInvoices.filter((invoice) =>
      inRange(invoice.createdAt, priorStart, priorEnd)
    );
    const gmv = sumAmounts(currentPaid);
    const priorGmv = sumAmounts(priorPaid);
    const successfulPurchases = currentPaid.length;
    const priorSuccessfulPurchases = priorPaid.length;
    const averagePurchaseValue = successfulPurchases > 0 ? money(gmv / successfulPurchases) : 0;
    const priorAveragePurchaseValue =
      priorSuccessfulPurchases > 0 ? money(priorGmv / priorSuccessfulPurchases) : 0;
    const financingRate = approvalRate(currentInvoices);
    const priorFinancingRate = approvalRate(priorInvoices);

    const knownBeforePrior = new Set(
      priorCustomers.map((invoice) => customerKey(invoice.buyerId, invoice.customerEmail))
    );
    for (const invoice of paidInvoices) {
      if (invoice.createdAt.getTime() < priorStart.getTime()) {
        knownBeforePrior.add(customerKey(invoice.buyerId, invoice.customerEmail));
      }
    }
    const knownBeforeCurrent = new Set(knownBeforePrior);
    for (const invoice of priorPaid) {
      knownBeforeCurrent.add(customerKey(invoice.buyerId, invoice.customerEmail));
    }

    const currentCustomers = this.customerCounts(currentPaid, knownBeforeCurrent);
    const priorCustomersCounts = this.customerCounts(priorPaid, knownBeforePrior);

    const lastSixStart = chartThisStart;
    const lastSixPaid = paidInvoices.filter(
      (invoice) => invoice.createdAt.getTime() >= lastSixStart.getTime()
    );
    const lastSixGmv = sumAmounts(lastSixPaid);
    const lastSixPurchases = lastSixPaid.length;

    let lastSettlement: { amount: number; settledDate: Date | null } | null = null;
    if (latestSettled?.batchReference) {
      const batch = await prisma.settlement.findMany({
        where: {
          merchantId: merchant.id,
          ...outletFilter,
          isSettled: true,
          batchReference: latestSettled.batchReference,
        },
        select: { credit: true, debit: true },
      });
      lastSettlement = {
        amount: money(batch.reduce((sum, row) => sum + Number(row.credit) - Number(row.debit), 0)),
        settledDate: latestSettled.settledDate,
      };
    }

    const nextAutomaticAmount = money(
      unsettledSettlements.reduce((sum, row) => sum + Number(row.credit) - Number(row.debit), 0)
    );

    return {
      merchant,
      outlets,
      range: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        priorStartDate: priorStart.toISOString(),
        priorEndDate: priorEnd.toISOString(),
        outletId: input.outletId ?? null,
      },
      summary: {
        gmv: { amount: gmv, priorAmount: priorGmv, changePercent: changePercent(gmv, priorGmv) },
        successfulPurchases: {
          count: successfulPurchases,
          priorCount: priorSuccessfulPurchases,
          changePercent: changePercent(successfulPurchases, priorSuccessfulPurchases),
        },
        financingApprovalRate: {
          rate: financingRate,
          priorRate: priorFinancingRate,
          changePercentagePoints:
            financingRate === null || priorFinancingRate === null
              ? null
              : money(financingRate - priorFinancingRate),
        },
        averagePurchaseValue: {
          amount: averagePurchaseValue,
          priorAmount: priorAveragePurchaseValue,
          changeAmount: money(averagePurchaseValue - priorAveragePurchaseValue),
        },
      },
      gmvPerformance: {
        thisPeriod: this.monthlySeries(paidInvoices, chartThisStart, endDate),
        previousPeriod: this.monthlySeries(
          paidInvoices,
          chartPreviousStart,
          new Date(chartThisStart.getTime() - 1)
        ),
        lastSixMonths: {
          gmv: lastSixGmv,
          successfulPurchases: lastSixPurchases,
          averagePurchaseValue: lastSixPurchases > 0 ? money(lastSixGmv / lastSixPurchases) : 0,
        },
      },
      requiresAttention: {
        total: pendingInvoices + awaitingFulfilment + returnRequests + disputesRequiringResponse,
        invoicesAwaitingCustomerAction: pendingInvoices,
        ordersAwaitingFulfilment: awaitingFulfilment,
        returnRequestsAwaitingReview: returnRequests,
        disputesRequiringResponse,
      },
      settlement: {
        nextAutomaticSettlement: {
          amount: nextAutomaticAmount,
          note: "After cutoff adjustments",
        },
        scheduledPayout: nextSchedule.nextPayOutDate,
        rollingReserveHeld: money(reserved._sum.amount),
        lastSettlement,
      },
      gmvByCategory: this.categoryBreakdown(currentPaid, gmv),
      customerInsights: {
        uniqueCustomers: {
          count: currentCustomers.unique,
          changePercent: changePercent(currentCustomers.unique, priorCustomersCounts.unique),
        },
        newCustomers: {
          count: currentCustomers.newCustomers,
          changePercent: changePercent(
            currentCustomers.newCustomers,
            priorCustomersCounts.newCustomers
          ),
        },
        returningCustomers: {
          count: currentCustomers.returning,
          changePercent: changePercent(currentCustomers.returning, priorCustomersCounts.returning),
        },
      },
      salesByProductType: this.productBreakdown(currentPaid, gmv),
      recentTransactions: {
        counts: {
          all: currentInvoices.length,
          pending: currentInvoices.filter((invoice) => invoice.status === InvoiceStatus.Pending)
            .length,
          approved: currentInvoices.filter((invoice) =>
            invoice.loan ? APPROVED_LOAN_STATUSES.includes(invoice.loan.loanStatus) : false
          ).length,
          captured: currentInvoices.filter((invoice) => invoice.status === InvoiceStatus.Paid)
            .length,
          fulfilmentPending: currentInvoices.filter(
            (invoice) =>
              invoice.status === InvoiceStatus.Paid &&
              (invoice.fulfillStatus === FulfillStatus.Pending ||
                invoice.fulfillStatus === FulfillStatus.AwaitingFulfillment)
          ).length,
          refunds: currentInvoices.filter(
            (invoice) =>
              invoice.status === InvoiceStatus.Refunded ||
              invoice.returnStatus === LoanReturnStatus.Pending ||
              invoice.returnStatus === LoanReturnStatus.Approved ||
              invoice.returnStatus === LoanReturnStatus.Refunded
          ).length,
          disputes: disputesInRange,
        },
        items: [...currentInvoices]
          .sort((left, right) => {
            const leftWaiting = left.fulfillStatus === FulfillStatus.AwaitingFulfillment ? 0 : 1;
            const rightWaiting = right.fulfillStatus === FulfillStatus.AwaitingFulfillment ? 0 : 1;
            if (leftWaiting !== rightWaiting) return leftWaiting - rightWaiting;
            return right.createdAt.getTime() - left.createdAt.getTime();
          })
          .slice(0, RECENT_TRANSACTION_LIMIT)
          .map((invoice) => ({
            id: invoice.id,
            transactionId: invoice.loan?.splitrId || invoice.splitrId,
            date: invoice.createdAt,
            customerName: invoice.customerName,
            purchaseAmount: money(invoice.amount),
            productName: productLabel(invoice),
            purchaseStatus: purchaseStatusLabel(invoice.status),
            fulfilmentStatus: fulfilmentStatusLabel(invoice.fulfillStatus),
          })),
      },
    };
  }

  private customerCounts(invoices: PaidInvoice[], knownBefore: Set<string>) {
    const keys = new Set(
      invoices.map((invoice) => customerKey(invoice.buyerId, invoice.customerEmail))
    );
    let newCustomers = 0;
    let returning = 0;
    for (const key of keys) {
      if (knownBefore.has(key)) returning += 1;
      else newCustomers += 1;
    }
    return { unique: keys.size, newCustomers, returning };
  }

  private monthlySeries(invoices: PaidInvoice[], start: Date, end: Date) {
    const points: { month: string; label: string; gmv: number; successfulPurchases: number }[] = [];
    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    while (cursor.getTime() <= last.getTime()) {
      const next = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
      const monthInvoices = invoices.filter(
        (invoice) =>
          invoice.createdAt.getTime() >= cursor.getTime() &&
          invoice.createdAt.getTime() < next.getTime()
      );
      points.push({
        month: monthKey(cursor),
        label: monthLabel(cursor),
        gmv: sumAmounts(monthInvoices),
        successfulPurchases: monthInvoices.length,
      });
      cursor = next;
    }
    return points;
  }

  private categoryBreakdown(invoices: PaidInvoice[], total: number) {
    const groups = new Map<string, number>();
    for (const invoice of invoices) {
      const name = invoice.category?.name ?? "Uncategorized";
      groups.set(name, (groups.get(name) ?? 0) + Number(invoice.amount));
    }
    return [...groups.entries()]
      .map(([category, amount]) => ({
        category,
        amount: money(amount),
        percent: total > 0 ? money((amount / total) * 100) : 0,
      }))
      .sort((left, right) => right.amount - left.amount);
  }

  private productBreakdown(invoices: PaidInvoice[], total: number) {
    const groups = new Map<string, { label: string; amount: number }>([
      ["payIn4", { label: "Pay-in-4 (P4)", amount: 0 }],
      ["payIn6", { label: "Pay-in-6 (P6)", amount: 0 }],
      ["monthlyFlex", { label: "Monthly Flex", amount: 0 }],
    ]);
    for (const invoice of invoices) {
      const group = productGroup(invoice);
      const current = groups.get(group.key) ?? { label: group.label, amount: 0 };
      current.amount += Number(invoice.amount);
      groups.set(group.key, current);
    }
    return [...groups.entries()]
      .filter(
        ([key, group]) =>
          key === "payIn4" || key === "payIn6" || key === "monthlyFlex" || group.amount > 0
      )
      .map(([key, group]) => ({
        key,
        label: group.label,
        amount: money(group.amount),
        percent: total > 0 ? money((group.amount / total) * 100) : 0,
      }));
  }
}

export const merchantDashboardService = new MerchantDashboardService();
