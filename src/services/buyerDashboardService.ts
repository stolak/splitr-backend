import { InvoiceStatus, LoanScheduleStatus, LoanStatus, Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
import { roundUpTo2Decimals } from "../utils/helper";
import { scoreService } from "./scoringService";

type PlanStatus = "onTrack" | "paymentDue" | "overdue" | "completed";

const ACTIVE_LOAN_STATUSES: LoanStatus[] = [
  LoanStatus.Active,
  LoanStatus.Approved,
  LoanStatus.Pause,
  LoanStatus.Default,
];

function money(value: Prisma.Decimal | number | null | undefined): number {
  return roundUpTo2Decimals(Number(value ?? 0));
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class BuyerDashboardService {
  async getDashboard(buyerId: string) {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      select: { id: true, firstName: true, lastName: true, splitrId: true },
    });
    if (!buyer) throw new Error("Buyer not found");

    const today = startOfUtcDay(new Date());
    const upcomingUntil = addUtcDays(today, 30);

    const [eligibility, loans, pendingInvoices] = await Promise.all([
      scoreService.buyerScore(buyerId),
      prisma.loan.findMany({
        where: { buyerId, loanStatus: { not: LoanStatus.Cancel } },
        include: {
          merchant: { select: { id: true, businessName: true, logoUrl: true } },
          product: { select: { productName: true, productType: true, tenure: true } },
          loanSchedules: { orderBy: { start: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.findMany({
        where: { buyerId, status: InvoiceStatus.Pending, loan: { is: null } },
        select: { amount: true },
      }),
    ]);

    const productSpendingPowers =
      eligibility?.products.map((product) => Number(product.availableSpendingPower)) ?? [];
    const totalSpendingPower = money(
      productSpendingPowers.length ? Math.max(0, ...productSpendingPowers) : 0
    );

    const plans = loans
      .filter((loan) => loan.loanStatus !== LoanStatus.Pending)
      .map((loan) => {
        const schedules = loan.loanSchedules.filter(
          (schedule) => schedule.status !== LoanScheduleStatus.Cancelled
        );
        const openSchedules = schedules.filter(
          (schedule) => schedule.status === LoanScheduleStatus.Open
        );
        const paidInstallments = schedules.filter(
          (schedule) => schedule.status === LoanScheduleStatus.Closed
        ).length;
        const installmentCount = schedules.length || loan.loanTenure;
        const totalAmount = schedules.length
          ? money(schedules.reduce((sum, schedule) => sum + Number(schedule.expectedPayment), 0))
          : money(loan.loanAmount);
        const remainingBalance = money(
          openSchedules.reduce((sum, schedule) => sum + Number(schedule.expectedPayment), 0)
        );
        const nextSchedule = [...openSchedules].sort(
          (left, right) => left.start.getTime() - right.start.getTime()
        )[0];
        const nextDue = nextSchedule ? startOfUtcDay(nextSchedule.start) : null;
        const status = this.planStatus(loan.loanStatus, nextDue, today);
        const progressPercent =
          installmentCount > 0 ? Math.round((paidInstallments / installmentCount) * 100) : 0;

        return {
          id: loan.id,
          planNumber: loan.splitrId,
          merchantId: loan.merchantId,
          merchantName: loan.merchant?.businessName ?? null,
          merchantLogoUrl: loan.merchant?.logoUrl ?? null,
          productName: loan.product?.productName ?? null,
          productType: loan.product?.productType ?? null,
          installmentCount,
          paidInstallments,
          progressPercent,
          nextPaymentDate: nextDue ? dateKey(nextDue) : null,
          nextPaymentAmount: nextSchedule ? money(nextSchedule.expectedPayment) : null,
          nextScheduleId: nextSchedule?.id ?? null,
          remainingBalance,
          totalAmount,
          status,
          loanStatus: loan.loanStatus,
        };
      });

    const activePlans = plans.filter((plan) => plan.status !== "completed");
    const outstandingFinancing = money(
      activePlans.reduce((sum, plan) => sum + plan.remainingBalance, 0)
    );
    const reservedForPendingPurchases = money(
      loans
        .filter((loan) => loan.loanStatus === LoanStatus.Pending)
        .reduce((sum, loan) => sum + Number(loan.loanAmount), 0) +
        pendingInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0)
    );
    // console.log("totalSpendingPower", totalSpendingPower);
    // console.log("outstandingFinancing", outstandingFinancing);
    // console.log("reservedForPendingPurchases", reservedForPendingPurchases);
    const availableSpendingPower = money(
      Math.max(0, totalSpendingPower - outstandingFinancing - reservedForPendingPurchases)
    );

    const upcomingPayments = activePlans
      .flatMap((plan) => {
        const loan = loans.find((item) => item.id === plan.id);
        if (!loan) return [];
        return loan.loanSchedules
          .filter((schedule) => schedule.status === LoanScheduleStatus.Open)
          .map((schedule) => ({ schedule, plan }));
      })
      .filter(({ schedule }) => {
        const due = startOfUtcDay(schedule.start);
        return due.getTime() >= today.getTime() && due.getTime() <= upcomingUntil.getTime();
      })
      .sort((left, right) => left.schedule.start.getTime() - right.schedule.start.getTime())
      .map(({ schedule, plan }) => ({
        scheduleId: schedule.id,
        loanId: plan.id,
        planNumber: plan.planNumber,
        dueDate: dateKey(startOfUtcDay(schedule.start)),
        amount: money(schedule.expectedPayment),
        merchantName: plan.merchantName,
        productName: plan.productName,
      }));

    const nextSource = [...activePlans]
      .filter((plan) => plan.nextPaymentDate)
      .sort((left, right) =>
        String(left.nextPaymentDate).localeCompare(String(right.nextPaymentDate))
      )[0];

    const counts = {
      all: plans.length,
      active: activePlans.length,
      onTrack: plans.filter((plan) => plan.status === "onTrack").length,
      paymentDue: plans.filter((plan) => plan.status === "paymentDue").length,
      overdue: plans.filter((plan) => plan.status === "overdue").length,
      completed: plans.filter((plan) => plan.status === "completed").length,
    };

    return {
      buyer: {
        id: buyer.id,
        splitrId: buyer.splitrId,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
      },
      spendingPower: {
        available: availableSpendingPower,
        total: totalSpendingPower,
        outstandingFinancing,
        reservedForPendingPurchases,
      },
      outstandingFinancing: {
        amount: outstandingFinancing,
        activePlanCount: counts.active,
      },
      nextPayment: nextSource
        ? {
            loanId: nextSource.id,
            planNumber: nextSource.planNumber,
            scheduleId: nextSource.nextScheduleId,
            amount: nextSource.nextPaymentAmount,
            dueDate: nextSource.nextPaymentDate,
            merchantName: nextSource.merchantName,
            productName: nextSource.productName,
          }
        : null,
      activePlans: counts,
      upcomingPayments,
      plans: [...plans].sort((left, right) => {
        if (left.status === "completed" && right.status !== "completed") return 1;
        if (right.status === "completed" && left.status !== "completed") return -1;
        return String(left.nextPaymentDate ?? "9999").localeCompare(
          String(right.nextPaymentDate ?? "9999")
        );
      }),
    };
  }

  private planStatus(loanStatus: LoanStatus, nextDue: Date | null, today: Date): PlanStatus {
    if (loanStatus === LoanStatus.Complete) return "completed";
    if (!nextDue) return "onTrack";
    if (nextDue.getTime() < today.getTime()) return "overdue";
    if (nextDue.getTime() === today.getTime()) return "paymentDue";
    return "onTrack";
  }
}

export const buyerDashboardService = new BuyerDashboardService();
