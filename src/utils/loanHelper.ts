import { Loan, LoanInstallmentType, TransactionType, TransactionStatus } from "@prisma/client";
import { roundUpTo2Decimals } from "./helper";

export interface GetLoanBalanceInput {
  transactionType: TransactionType;
  transactionStatus: TransactionStatus;
  creditAmount: number;
  debitAmount: number;
}

export type LoanScheduleRecord = {
  status: string;
  [key: string]: any;
};

export function getLoanBalance(input: GetLoanBalanceInput[]): number {
  const balance = input.reduce(
    (sum, item) => Number(sum) + Number(item.creditAmount) - item.debitAmount,
    0
  );
  const rounded = roundUpTo2Decimals(balance) ?? 0;
  if (Math.abs(rounded) <= 0.3) {
    return 0;
  }
  return Math.max(0, rounded);
}

export function getLoanLiquidatingBalance(
  input: GetLoanBalanceInput[],
  principal: number,
  interest: number,
  installmentType: LoanInstallmentType
): number {
  const balance = input.reduce(
    (sum, item) => Number(sum) + Number(item.creditAmount) - item.debitAmount,
    0
  );

  const rounded =
    installmentType === LoanInstallmentType.Monthly
      ? (roundUpTo2Decimals(balance + Number(principal) * (Number(interest) / 12) * 0.01) ?? 0)
      : (roundUpTo2Decimals(balance + Number(principal) * Number(interest) * 0.01) ?? 0);
  if (Math.abs(rounded) <= 0.3) {
    return 0;
  }
  return Math.max(0, rounded);
}

export function getAmountDue(input: Loan & { loanSchedules?: any[]; loanTransactions?: any[] }) {
  const lastExecutedScheduleBalance = input.loanSchedules
    ?.filter((schedule) => schedule.isExecuted)
    .sort((a, b) => new Date(a.end).getTime() - new Date(b.end).getTime())[0];

  const overallBalance = getLoanBalance(input.loanTransactions as unknown as GetLoanBalanceInput[]);
  if (lastExecutedScheduleBalance) {
    const amountDue = roundUpTo2Decimals(
      Number(overallBalance) - Number(lastExecutedScheduleBalance.expectedClosingBalance)
    );
    return { amountDue: Math.max(0, amountDue ?? 0) };
  }
  return { amountDue: 0 };
}

export function getLoanBalanceByTransactionType3(
  transactionType: TransactionType,
  input: GetLoanBalanceInput[]
): number {
  const balance = input
    .filter((item) => item.transactionType === transactionType)
    .reduce((sum, item) => Number(sum) + Number(item.creditAmount) - Number(item.debitAmount), 0);
  const rounded = roundUpTo2Decimals(balance) ?? 0;
  if (Math.abs(rounded) <= 0.2) {
    return 0;
  }
  return Math.max(0, rounded);
}

export function countClosedSchedules(records: LoanScheduleRecord[]): number {
  return records.filter((r) => r.status === "Closed").length;
}

export function flatRateInterestCalculation(rate: number, amount: number) {
  const interest = roundUpTo2Decimals((amount * rate) / (100 + rate));
  const principal = roundUpTo2Decimals(amount - interest);

  return {
    principal,
    interest,
  };
}

export function nextSchedule(
  rate: number,
  openingBalance: number,
  monthlyRepayment: number,
  installmentType: LoanInstallmentType
) {
  let interest = 0;
  if (installmentType === LoanInstallmentType.Monthly) {
    interest = roundUpTo2Decimals((openingBalance * rate * 0.01) / 12);
  } else {
    const flatRate = flatRateInterestCalculation(rate, monthlyRepayment);
    if (flatRate.principal > openingBalance) {
      interest = roundUpTo2Decimals(openingBalance * rate * 0.01);
    } else {
      interest = flatRate.interest;
    }
  }
  const calculatedPrincipal = roundUpTo2Decimals(monthlyRepayment - interest);
  const principal = roundUpTo2Decimals(Math.min(calculatedPrincipal, openingBalance));
  let closingBalance = roundUpTo2Decimals(openingBalance - principal);
  if (Math.abs(closingBalance) <= 0.3) {
    closingBalance = 0;
  }

  return {
    interest,
    principal,
    openingBalance: roundUpTo2Decimals(openingBalance),
    closingBalance,
  };
}

export function calculateSchedule(
  monthlyRepay: number,
  principalBalance: number,
  interestRate: number,
  installmentType: LoanInstallmentType
) {
  if (!Number.isFinite(monthlyRepay) || monthlyRepay <= 0) {
    throw new Error("monthlyRepay must be a positive number");
  }
  if (!Number.isFinite(principalBalance)) {
    throw new Error("principalBalance must be a valid number");
  }
  if (!Number.isFinite(interestRate) || interestRate < 0) {
    throw new Error("interestRate must be a non-negative number");
  }

  const schedule: Array<{
    month: number;
    openingBalance: number;
    closingBalance: number;
    amountPay: number;
  }> = [];

  let balance = principalBalance < 0 ? 0 : principalBalance;
  let month = 1;
  const maxMonths = 12;
  let amountPay = 0;

  while (balance > 0) {
    if (month > maxMonths) {
      throw new Error(
        "Schedule exceeded maximum months; monthlyRepay may be too low to cover interest"
      );
    }

    let openingBalance = roundUpTo2Decimals(balance);
    let closingBalance = 0;
    let principalPaid = 0;
    if (installmentType === LoanInstallmentType.Monthly) {
      const interest = roundUpTo2Decimals((openingBalance * (interestRate / 100)) / 12);

      amountPay = roundUpTo2Decimals(Math.min(monthlyRepay, openingBalance + interest));
      principalPaid = roundUpTo2Decimals(amountPay - interest);
      closingBalance = Math.max(0, roundUpTo2Decimals(openingBalance - principalPaid) ?? 0);
    } else {
      const { principal } = flatRateInterestCalculation(interestRate, monthlyRepay);
      principalPaid = Math.min(principal, balance);

      openingBalance = roundUpTo2Decimals(balance);
      const interest = principalPaid * interestRate * 0.01;

      amountPay = principalPaid + interest;
      principalPaid = roundUpTo2Decimals(amountPay - interest);
      closingBalance = openingBalance - principalPaid;
    }
    if (Math.abs(closingBalance) <= 0.3) {
      closingBalance = 0;
    }

    schedule.push({
      month,
      openingBalance,
      closingBalance,
      amountPay,
    });

    balance = closingBalance;
    month++;
  }

  return schedule;
}
