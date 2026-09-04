import prisma from "../utils/prisma";

export interface IncomeRecurrentInput {
  incomeMonths: number;
  dominantSourceCount: number;
  isFiftMonth: boolean;
  isSixtMonth: boolean;
}
export interface IncomeStabilityInput {
  averageIncome: number;
  monthlyIncomes: number[];
}

export interface MonthlyScores {
  M1: number; // Month 1
  M2: number; // Month 2
  M3: number; // Month 3
  M4: number; // Month 4
  M5: number; // Month 5
  M6: number; // Month 6
}

export interface RiskFlags {
  M1: { count: number; description: string[] };
  M2: { count: number; description: string[] };
  M3: { count: number; description: string[] };
  M4: { count: number; description: string[] };
  M5: { count: number; description: string[] };
  M6: { count: number; description: string[] };
}

export interface inFlow {
  M1: number; // Month 1
  M2: number; // Month 2
  M3: number; // Month 3
  M4: number; // Month 4
  M5: number; // Month 5
  M6: number; // Month 6
}
export interface Outflow {
  M1: number; // Month 1
  M2: number; // Month 2
  M3: number; // Month 3
  M4: number; // Month 4
  M5: number; // Month 5
  M6: number; // Month 6
}

export interface CashFlow {
  inFlow: inFlow;
  outflow: Outflow;
}
export interface LoanRepayment {
  M1: number; // Month 1
  M2: number; // Month 2
  M3: number; // Month 3
  M4: number; // Month 4
  M5: number; // Month 5
  M6: number; // Month 6
}
export interface NumberOfUniquesNegativeBalances {
  M1: number; // Month 1
  M2: number; // Month 2
  M3: number; // Month 3
  M4: number; // Month 4
  M5: number; // Month 5
  M6: number; // Month 6
}

export interface LiquidityBufferMonthSnapshot {
  /**
   * Balance immediately before the month's primary income credit.
   * Used only when recurring income exists.
   */
  preIncomeBalance: number;
  /**
   * Month-end balance.
   * Used only when recurring income does NOT exist.
   */
  monthEndBalance: number;
}

export interface LiquidityBufferInput {
  /**
   * Up to the last 6 months of snapshots (most recent can be first or last).
   * The scoring logic uses the number of months provided (typically 6).
   */
  months: LiquidityBufferMonthSnapshot[];

  /**
   * If recurring income exists, liquidity ratio is computed as:
   * preIncomeBalance / estimatedMonthlyIncome.
   */
  recurringIncomeExists: boolean;

  /**
   * Estimated monthly income (used when recurringIncomeExists is true).
   */
  estimatedMonthlyIncome?: number;

  /**
   * Average monthly inflow (used when recurringIncomeExists is false).
   */
  averageMonthlyInflow?: number;
}

export interface ScoringInput {
  incomeRecurrent: IncomeRecurrentInput;
  incomeStability: IncomeStabilityInput;
  /**
   * Number of months (out of the observed window) with positive net cash flow.
   */
  netCashFlowPositiveCount: number;
  liquidityBuffer: LiquidityBufferInput;

  /**
   * Credit history bucket (expected values based on your `creditBehaviorScore`):
   * 1 => best, 2 => medium, 3 => weak, else => 0.
   */
  creditHistory: number;
  /**
   * Risk factor monthly inputs used in `riskFactorScore`.
   */
  riskFactor: MonthlyScores;
  riskFlags?: RiskFlags;
  overdraftEvents?: number;
  overdraftDeepestNegativeBalance?: number;
  overdraftNegativeDays?: number;
  overdraftRecent?: boolean;

  /**
   * Existing monthly loan repayment amount (₦) used for eligibility determination.
   */
  existingLoanRepayment: number;
  incomeClassification?: string;
  cashFlow?: CashFlow;
  loanRepayment?: LoanRepayment;
  numberOfUniquesNegativeBalances?: NumberOfUniquesNegativeBalances;
}

export interface SelfAssessmentScoringInput {
  /**
   * Used to compute:
   * - incomeRecurrentScore (via `incomeRecurrent`)
   * - incomeStabilityScore / netCashFlowScore / liquidityBufferScore (self-assessment rules)
   */
  incomeRecurrent: IncomeRecurrentInput;
  /**
   * Number of overdraft events in the observed window.
   */
  overdraftCount: number;
  /**
   * Overdraft event count used for self-assessment overdraft scoring.
   */
  overdraftEvents: number;
  /**
   * Deepest negative balance during overdraft window.
   */
  overdraftDeepestNegativeBalance: number;
  /**
   * Total number of days with negative balance.
   */
  overdraftNegativeDays: number;
  /**
   * Whether overdraft occurred in last 2 months.
   */
  overdraftRecent: boolean;
  /**
   * Credit history bucket (expected values based on your `creditBehaviorScore`):
   * 1 => best, 2 => medium, 3 => weak, else => 0.
   */
  creditHistory: number;
  /**
   * Risk factor monthly inputs used in `riskFactorScore`.
   */
  totalFlags: number;

  /**
   * Estimated monthly income (₦) used for eligibility determination.
   */
  estimatedMonthlyIncome: number;

  /**
   * Existing monthly loan repayment amount (₦) used for eligibility determination.
   */
  existingLoanRepayment: number;
}

export type EligibilityRiskLevel = "high" | "medium" | "low";

export interface EligibilityDeterminationResult {
  eligible: boolean;
  riskLevel: EligibilityRiskLevel;
  dtiRatio: number;
}
export interface OpenBankingInput {
  monthlyIncome: number;
  incomeStabilityVariance: number;
  netCashFlowPercentage: number;
  liquidityMonths: number;
  nsfEvents: number;
  overdraftFrequency: number;
  loanBurdenPercentage: number;
}

export interface OpenBankingScoreResult {
  totalScore: number;
  components: {
    variable: string;
    rawScore: number;
    weight: number;
    weightedScore: number;
  }[];
}

export interface CreditBureauInput {
  creditScore: number;
  utilizationPercentage: number;
  delinquencies24Months: number;
  collections: "NONE" | "PAID" | "ACTIVE";
  hardInquiries12Months: number;
  bankruptcy: "NONE" | "DISCHARGED_OVER_5_YEARS" | "ACTIVE_OR_RECENT";
}

export interface CreditBureauComponent {
  variable: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
}

export interface CreditBureauScoreResult {
  rawWeightedScore: number;
  score: number;
  components: CreditBureauComponent[];
}

export interface MerchantRiskInput {
  merchantCategory: string;
  merchantCategoryScore: number;
  purchaseUtilizationPercentage: number;
}

export interface MerchantRiskComponent {
  variable: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
}

export interface MerchantRiskScoreResult {
  score: number;
  components: MerchantRiskComponent[];
}

export type CustomerLenderType = "FIRST_TIME_LENDER" | "RETURNING_CUSTOMER";

export interface FinalCustomerScoreInput {
  customerType: CustomerLenderType;
  openBanking: OpenBankingInput;
  creditBureau: CreditBureauInput;
  merchantRisk: MerchantRiskInput;
  /** Required for RETURNING_CUSTOMER — percentage (0–100+) of on-time payments */
  onTimePaymentRatio?: number;
  /** Required for RETURNING_CUSTOMER — percentage (0–100+) ACH success rate */
  achSuccessRate?: number;
}

export interface FinalCustomerScoreComponent {
  variable: string;
  score: number;
  weight: number;
  weightedScore: number;
  isDefault?: boolean;
}

export interface BehaviouralRepaymentScoreResult {
  onTimePaymentScore: number;
  achSuccessScore: number;
  behaviouralScore: number;
}

export interface FinalCustomerScoreResult {
  customerType: CustomerLenderType;
  finalScore: number;
  components: FinalCustomerScoreComponent[];
  breakdown: {
    openBanking: OpenBankingScoreResult;
    creditBureau: CreditBureauScoreResult;
    merchantRisk: MerchantRiskScoreResult;
    bri: BehaviouralRepaymentScoreResult & {
      normalizedScore: number;
      isDefault: boolean;
      note?: string;
    };
  };
}

export type RiskTier = "A+" | "A" | "B" | "C" | "D";

export interface RiskAdjustmentTier {
  minScore: number;
  maxScore: number;
  riskTier: RiskTier;
  multiplier: number;
  maximumExposureCap: number;
  treatment: string;
}

export interface BehaviouralAdjustmentTier {
  minScore: number;
  maxScore: number;
  behaviourTier: RiskTier;
  multiplier: number;
  treatment: string;
}

export interface SpendingPowerConfig {
  affordability: {
    allocationPercentage: number;
  };
  riskAdjustment: {
    tiers: RiskAdjustmentTier[];
  };
  behaviouralAdjustment: {
    tiers: BehaviouralAdjustmentTier[];
  };
  maximumExposure: number;
}

export interface SpendingPowerInput {
  disposableIncome: number;
  riskScore: number;
  behaviourScore: number;
}

export interface SpendingPowerResult {
  affordableMonthlyRepaymentCapacity: number;
  riskScore: number;
  riskTier: RiskTier;
  riskMultiplier: number;
  riskAdjustedCapacity: number;
  behaviourScore: number;
  behaviourTier: RiskTier;
  behaviourMultiplier: number;
  behaviourAdjustedCapacity: number;
  maximumExposureCap: number;
  maximumExposure: number;
  totalSpendingPower: number;
}

export type RepaymentInstallmentCount = 4 | 6;

export interface RepaymentPlan {
  installmentNumber: number;
  amount: number;
  dueWeek: number;
}

export interface RepaymentOptions {
  loanAmount: number;
  monthlySpendingPower: number;
  numberOfInstallments: RepaymentInstallmentCount;
  firstInstallment?: number;
}

export interface FinancingEvaluationInput {
  productAmount: number;
  customerMaxRepayment: number;
  maxPrincipal: number;
  rate: number;
  months: number;
  intendedUpfrontPayment?: number;
}

export interface FinancingEvaluationPassed {
  status: "PASSED";
  productAmount: number;
  upfrontPayment: number;
  financeAmount: number;
  monthlyRepayment: number;
  maximumFinanceAmount: number;
  minimumUpfrontRequired: number;
  message: string;
}

export interface FinancingEvaluationFailed {
  status: "FAILED";
  reason: "INVALID_UPFRONT_PAYMENT" | "FINANCE_AMOUNT_EXCEEDS_LIMIT";
  message: string;
  productAmount?: number;
  intendedUpfrontPayment?: number;
  intendedFinanceAmount?: number;
  maximumFinanceAmount?: number;
  minimumUpfrontRequired?: number;
  additionalUpfrontRequired?: number;
}

export type FinancingEvaluationResult =
  | FinancingEvaluationPassed
  | FinancingEvaluationFailed;

export const DEFAULT_SPENDING_POWER_CONFIG: SpendingPowerConfig = {
  affordability: {
    allocationPercentage: 0.25,
  },
  riskAdjustment: {
    tiers: [
      {
        minScore: 90,
        maxScore: 100,
        riskTier: "A+",
        multiplier: 1.5,
        maximumExposureCap: 7500,
        treatment: "Highest permitted positive adjustment, still subject to Maximum Exposure.",
      },
      {
        minScore: 80,
        maxScore: 89,
        riskTier: "A",
        multiplier: 1.25,
        maximumExposureCap: 6000,
        treatment: "Positive adjustment, subject to caps.",
      },
      {
        minScore: 70,
        maxScore: 79,
        riskTier: "B",
        multiplier: 1.0,
        maximumExposureCap: 5000,
        treatment: "Neutral adjustment.",
      },
      {
        minScore: 60,
        maxScore: 69,
        riskTier: "C",
        multiplier: 0.75,
        maximumExposureCap: 3500,
        treatment: "Reduced capacity; product eligibility in Section 4.2.6 still applies.",
      },
      {
        minScore: 0,
        maxScore: 59,
        riskTier: "D",
        multiplier: 0.0,
        maximumExposureCap: 0,
        treatment:
          "Decline for financing unless a separate approved policy explicitly permits otherwise.",
      },
    ],
  },
  behaviouralAdjustment: {
    tiers: [
      {
        minScore: 90,
        maxScore: 100,
        behaviourTier: "A+",
        multiplier: 1.5,
        treatment: "Highest permitted positive adjustment, still subject to Maximum Exposure.",
      },
      {
        minScore: 80,
        maxScore: 89,
        behaviourTier: "A",
        multiplier: 1.25,
        treatment: "Positive adjustment, subject to caps.",
      },
      {
        minScore: 70,
        maxScore: 79,
        behaviourTier: "B",
        multiplier: 1.0,
        treatment: "Neutral adjustment.",
      },
      {
        minScore: 60,
        maxScore: 69,
        behaviourTier: "C",
        multiplier: 0.75,
        treatment: "Reduced capacity; product eligibility in Section 4.2.6 still applies.",
      },
      {
        minScore: 0,
        maxScore: 59,
        behaviourTier: "D",
        multiplier: 0.0,
        treatment:
          "Decline for financing unless a separate approved policy explicitly permits otherwise.",
      },
    ],
  },
  maximumExposure: 500000,
};

const FINAL_SCORE_WEIGHTS: Record<
  CustomerLenderType,
  {
    openBanking: number;
    creditBureau: number;
    merchantRisk: number;
    bri: number;
  }
> = {
  FIRST_TIME_LENDER: {
    openBanking: 45,
    creditBureau: 40,
    merchantRisk: 10,
    bri: 5,
  },
  RETURNING_CUSTOMER: {
    openBanking: 40,
    creditBureau: 30,
    merchantRisk: 10,
    bri: 20,
  },
};

export class ScoringService {
  // scoring score max 100 points
  async scoring(input: ScoringInput) {
    const incomeRecurrentResult = await this.incomeRecurrent(input.incomeRecurrent);
    const incomeRecurrentScore = Number(incomeRecurrentResult?.score ?? 0) || 0;

    const incomeStabilityScore = Number(await this.incomeStability(input.incomeStability)) || 0;
    const netCashFlowScore = Number(
      await this.netCashFlow(
        input.cashFlow ?? {
          inFlow: { M1: 0, M2: 0, M3: 0, M4: 0, M5: 0, M6: 0 },
          outflow: { M1: 0, M2: 0, M3: 0, M4: 0, M5: 0, M6: 0 },
        }
      )
    );

    const liquidityBufferResult = await this.liquidityBuffer(input.liquidityBuffer);
    const liquidityBufferScore = Number(liquidityBufferResult?.score ?? 0) || 0;

    const overdraftScore =
      Number(
        this.overdraftScore(
          input.overdraftEvents ?? 0,
          input.overdraftDeepestNegativeBalance ?? 0,
          input.overdraftNegativeDays ?? 0,
          input.overdraftRecent ?? false
        )
      ) || 0;
    const creditBehaviorScore = 10; // Number(await this.creditBehaviorScore(input.creditHistory)) || 0;
    const riskFactorScore = Number(this.riskFactorScore(input.riskFactor)) || 0;

    const finalScore =
      incomeRecurrentScore === 0
        ? 0
        : incomeRecurrentScore +
          incomeStabilityScore +
          netCashFlowScore +
          liquidityBufferScore +
          overdraftScore +
          creditBehaviorScore +
          riskFactorScore;
    let eligibility = 0;
    if (finalScore >= 50 && finalScore <= 55) {
      eligibility = 0.5;
    } else if (finalScore >= 55 && finalScore <= 60) {
      eligibility = 0.75;
    } else if (finalScore > 60) {
      eligibility = 1;
    }
    const eligible = this.determineEligibility(
      finalScore,
      input.existingLoanRepayment,
      input.incomeStability.averageIncome
    );
    return {
      finalScore,
      eligibility,
      eligible,
      breakdown: {
        incomeRecurrentScore: { weight: 25, score: incomeRecurrentScore },
        incomeStabilityScore: { weight: 15, score: incomeStabilityScore },
        netCashFlowScore: { weight: 15, score: netCashFlowScore },
        liquidityBufferScore: { weight: 10, score: liquidityBufferScore },
        overdraftScore: { weight: 10, score: overdraftScore },
        creditBehaviorScore: { weight: 15, score: creditBehaviorScore },
        riskFactorScore: { weight: 10, score: riskFactorScore },
      },
      details: {
        incomeRecurrent: incomeRecurrentResult,
        liquidityBuffer: liquidityBufferResult,
      },
    };
  }

  calculateOpenBankingScore(input: OpenBankingInput): OpenBankingScoreResult {
    const monthlyIncomeScore =
      input.monthlyIncome > 8000
        ? 10
        : input.monthlyIncome >= 6000
          ? 8
          : input.monthlyIncome >= 4000
            ? 6
            : input.monthlyIncome >= 2500
              ? 4
              : 2;

    const incomeStabilityScore =
      input.incomeStabilityVariance < 10
        ? 10
        : input.incomeStabilityVariance <= 20
          ? 8
          : input.incomeStabilityVariance <= 30
            ? 5
            : 2;

    const cashFlowScore =
      input.netCashFlowPercentage > 40
        ? 10
        : input.netCashFlowPercentage >= 25
          ? 8
          : input.netCashFlowPercentage >= 10
            ? 5
            : input.netCashFlowPercentage >= 0
              ? 2
              : 0;

    const liquidityScore =
      input.liquidityMonths > 6
        ? 10
        : input.liquidityMonths >= 4
          ? 8
          : input.liquidityMonths >= 2
            ? 5
            : input.liquidityMonths >= 1
              ? 2
              : 0;

    const nsfScore =
      input.nsfEvents === 0 ? 10 : input.nsfEvents === 1 ? 7 : input.nsfEvents === 2 ? 4 : 0;

    const overdraftScore =
      input.overdraftFrequency === 0
        ? 10
        : input.overdraftFrequency <= 2
          ? 7
          : input.overdraftFrequency <= 4
            ? 4
            : 0;

    const loanBurdenScore =
      input.loanBurdenPercentage < 10
        ? 10
        : input.loanBurdenPercentage <= 20
          ? 8
          : input.loanBurdenPercentage <= 35
            ? 5
            : 0;

    const components = [
      {
        variable: "Monthly Income",
        rawScore: monthlyIncomeScore,
        weight: 15,
        weightedScore: monthlyIncomeScore * 0.15,
      },
      {
        variable: "Income Stability",
        rawScore: incomeStabilityScore,
        weight: 20,
        weightedScore: incomeStabilityScore * 0.2,
      },
      {
        variable: "Net Cash Flow",
        rawScore: cashFlowScore,
        weight: 25,
        weightedScore: cashFlowScore * 0.25,
      },
      {
        variable: "Liquidity Buffer",
        rawScore: liquidityScore,
        weight: 7.5,
        weightedScore: liquidityScore * 0.075,
      },
      {
        variable: "NSF Events",
        rawScore: nsfScore,
        weight: 10,
        weightedScore: nsfScore * 0.1,
      },
      {
        variable: "Overdraft Frequency",
        rawScore: overdraftScore,
        weight: 7.5,
        weightedScore: overdraftScore * 0.075,
      },
      {
        variable: "Existing Loan Burden",
        rawScore: loanBurdenScore,
        weight: 15,
        weightedScore: loanBurdenScore * 0.15,
      },
    ];

    const totalScore = components.reduce((total, component) => total + component.weightedScore, 0);

    return {
      totalScore,
      components,
    };
  }

  calculateCreditBureauScore(input: CreditBureauInput): CreditBureauScoreResult {
    const creditScore =
      input.creditScore >= 800
        ? 10
        : input.creditScore >= 750
          ? 9
          : input.creditScore >= 700
            ? 8
            : input.creditScore >= 650
              ? 6
              : input.creditScore >= 600
                ? 4
                : input.creditScore >= 550
                  ? 2
                  : 0;

    const utilizationScore =
      input.utilizationPercentage <= 30
        ? 10
        : input.utilizationPercentage <= 50
          ? 8
          : input.utilizationPercentage <= 70
            ? 5
            : input.utilizationPercentage <= 90
              ? 2
              : 0;

    const delinquencyScore =
      input.delinquencies24Months === 0
        ? 10
        : input.delinquencies24Months === 1
          ? 8
          : input.delinquencies24Months === 2
            ? 5
            : input.delinquencies24Months === 3
              ? 2
              : 0;

    const collectionsScore =
      input.collections === "NONE" ? 10 : input.collections === "PAID" ? 5 : 0;

    const inquiriesScore =
      input.hardInquiries12Months <= 2
        ? 10
        : input.hardInquiries12Months <= 5
          ? 7
          : input.hardInquiries12Months <= 8
            ? 4
            : 0;

    const bankruptcyScore =
      input.bankruptcy === "NONE" ? 10 : input.bankruptcy === "DISCHARGED_OVER_5_YEARS" ? 5 : 0;

    const components: CreditBureauComponent[] = [
      {
        variable: "Credit Score",
        rawScore: creditScore,
        weight: 35,
        weightedScore: creditScore * 0.35,
      },
      {
        variable: "Utilization",
        rawScore: utilizationScore,
        weight: 15,
        weightedScore: utilizationScore * 0.15,
      },
      {
        variable: "Delinquencies",
        rawScore: delinquencyScore,
        weight: 15,
        weightedScore: delinquencyScore * 0.15,
      },
      {
        variable: "Collections",
        rawScore: collectionsScore,
        weight: 25,
        weightedScore: collectionsScore * 0.25,
      },
      {
        variable: "Inquiries",
        rawScore: inquiriesScore,
        weight: 5,
        weightedScore: inquiriesScore * 0.05,
      },
      {
        variable: "Bankruptcy",
        rawScore: bankruptcyScore,
        weight: 5,
        weightedScore: bankruptcyScore * 0.05,
      },
    ];

    const rawWeightedScore = components.reduce(
      (total, component) => total + component.weightedScore,
      0
    );

    const score = rawWeightedScore * 10;

    return {
      rawWeightedScore,
      score,
      components,
    };
  }

  private validateScore(score: number, fieldName: string): void {
    if (!Number.isFinite(score)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    if (score < 0 || score > 10) {
      throw new Error(`${fieldName} must be between 0 and 10`);
    }
  }

  private getPurchaseUtilizationScore(utilization: number): number {
    if (!Number.isFinite(utilization)) {
      throw new Error("Purchase utilization must be a valid number");
    }

    if (utilization < 0) {
      throw new Error("Purchase utilization cannot be negative");
    }

    if (utilization < 20) {
      return 10;
    }

    if (utilization <= 40) {
      return 8;
    }

    if (utilization <= 60) {
      return 5;
    }

    if (utilization <= 80) {
      return 3;
    }

    return 0;
  }

  calculateMerchantRiskScore(input: MerchantRiskInput): MerchantRiskScoreResult {
    if (!input.merchantCategory?.trim()) {
      throw new Error("Merchant category is required");
    }

    this.validateScore(input.merchantCategoryScore, "Merchant category score");

    const utilizationScore = this.getPurchaseUtilizationScore(input.purchaseUtilizationPercentage);

    const categoryWeightedScore = input.merchantCategoryScore * 0.6;
    const utilizationWeightedScore = utilizationScore * 0.4;
    const score = categoryWeightedScore + utilizationWeightedScore;

    const components: MerchantRiskComponent[] = [
      {
        variable: "Merchant Category Risk",
        rawScore: input.merchantCategoryScore,
        weight: 60,
        weightedScore: categoryWeightedScore,
      },
      {
        variable: "Purchase Utilization",
        rawScore: utilizationScore,
        weight: 40,
        weightedScore: utilizationWeightedScore,
      },
    ];

    return {
      score,
      components,
    };
  }

  private getOnTimePaymentScore(ratio: number): number {
    if (ratio >= 100) {
      return 10;
    }

    if (ratio >= 95) {
      return 8;
    }

    if (ratio >= 90) {
      return 5;
    }

    return 0;
  }

  private getAchSuccessScore(rate: number): number {
    if (rate >= 100) {
      return 10;
    }

    if (rate >= 95) {
      return 8;
    }

    if (rate >= 90) {
      return 5;
    }

    return 0;
  }

  /**
   * Behavioural Repayment Intelligence (BRI).
   * First-time customers receive a neutral score of 0.
   * Existing customers: (On-Time Payment × 60%) + (ACH Success × 40%).
   */
  calculateBehaviouralRepaymentScore(
    isExistingCustomer: boolean,
    onTimePaymentRatio: number,
    achSuccessRate: number
  ): BehaviouralRepaymentScoreResult {
    if (!isExistingCustomer) {
      return {
        onTimePaymentScore: 0,
        achSuccessScore: 0,
        behaviouralScore: 0,
      };
    }

    if (!Number.isFinite(onTimePaymentRatio)) {
      throw new Error("onTimePaymentRatio must be a valid number");
    }

    if (!Number.isFinite(achSuccessRate)) {
      throw new Error("achSuccessRate must be a valid number");
    }

    if (onTimePaymentRatio < 0) {
      throw new Error("onTimePaymentRatio cannot be negative");
    }

    if (achSuccessRate < 0) {
      throw new Error("achSuccessRate cannot be negative");
    }

    const onTimePaymentScore = this.getOnTimePaymentScore(onTimePaymentRatio);
    const achSuccessScore = this.getAchSuccessScore(achSuccessRate);
    const behaviouralScore = onTimePaymentScore * 0.6 + achSuccessScore * 0.4;

    return {
      onTimePaymentScore,
      achSuccessScore,
      behaviouralScore: Number(behaviouralScore.toFixed(2)),
    };
  }

  calculateFinalCustomerScore(input: FinalCustomerScoreInput): FinalCustomerScoreResult {
    if (input.customerType !== "FIRST_TIME_LENDER" && input.customerType !== "RETURNING_CUSTOMER") {
      throw new Error("customerType must be FIRST_TIME_LENDER or RETURNING_CUSTOMER");
    }

    const isExistingCustomer = input.customerType === "RETURNING_CUSTOMER";

    if (isExistingCustomer) {
      if (typeof input.onTimePaymentRatio !== "number") {
        throw new Error("onTimePaymentRatio is required for RETURNING_CUSTOMER");
      }
      if (typeof input.achSuccessRate !== "number") {
        throw new Error("achSuccessRate is required for RETURNING_CUSTOMER");
      }
    }

    const weights = FINAL_SCORE_WEIGHTS[input.customerType];
    const openBanking = this.calculateOpenBankingScore(input.openBanking);
    const creditBureau = this.calculateCreditBureauScore(input.creditBureau);
    const merchantRisk = this.calculateMerchantRiskScore(input.merchantRisk);
    const bri = this.calculateBehaviouralRepaymentScore(
      isExistingCustomer,
      input.onTimePaymentRatio ?? 0,
      input.achSuccessRate ?? 0
    );

    // Normalize all pillars to a 0–100 scale before applying portfolio weights.
    const openBankingNormalized = openBanking.totalScore * 10;
    const creditBureauNormalized = creditBureau.score;
    const merchantRiskNormalized = merchantRisk.score * 10;
    const briNormalized = bri.behaviouralScore * 10;

    const components: FinalCustomerScoreComponent[] = [
      {
        variable: "Open Banking Score",
        score: openBankingNormalized,
        weight: weights.openBanking,
        weightedScore: openBankingNormalized * (weights.openBanking / 100),
      },
      {
        variable: "Credit Bureau Score",
        score: creditBureauNormalized,
        weight: weights.creditBureau,
        weightedScore: creditBureauNormalized * (weights.creditBureau / 100),
      },
      {
        variable: "Merchant Risk Score",
        score: merchantRiskNormalized,
        weight: weights.merchantRisk,
        weightedScore: merchantRiskNormalized * (weights.merchantRisk / 100),
      },
      {
        variable: "Behavioral Repayment Intelligence (BRI)",
        score: briNormalized,
        weight: weights.bri,
        weightedScore: briNormalized * (weights.bri / 100),
        isDefault: !isExistingCustomer,
      },
    ];

    const finalScore = components.reduce((total, component) => total + component.weightedScore, 0);

    return {
      customerType: input.customerType,
      finalScore,
      components,
      breakdown: {
        openBanking,
        creditBureau,
        merchantRisk,
        bri: {
          ...bri,
          normalizedScore: briNormalized,
          isDefault: !isExistingCustomer,
          ...(!isExistingCustomer
            ? { note: "First-time lenders receive a neutral BRI score of 0" }
            : {}),
        },
      },
    };
  }

  private getRiskAdjustment(score: number, config: SpendingPowerConfig): RiskAdjustmentTier {
    const tier = config.riskAdjustment.tiers.find(
      (item) => score >= item.minScore && score <= item.maxScore
    );

    if (!tier) {
      throw new Error(`No risk adjustment configuration found for score: ${score}`);
    }

    return tier;
  }

  private getBehaviouralAdjustment(
    score: number,
    config: SpendingPowerConfig
  ): BehaviouralAdjustmentTier {
    const tier = config.behaviouralAdjustment.tiers.find(
      (item) => score >= item.minScore && score <= item.maxScore
    );

    if (!tier) {
      throw new Error(`No behavioural adjustment configuration found for score: ${score}`);
    }

    return tier;
  }

  /**
   * Load spending power config from DB (SpendingPowerConfig + related tiers).
   * Falls back to DEFAULT_SPENDING_POWER_CONFIG when no row exists.
   */
  async fetchSpendingPowerConfigFromDb(configId: string = "default"): Promise<SpendingPowerConfig> {
    const record = await prisma.spendingPowerConfig.findUnique({
      where: { id: configId },
      include: {
        riskTiers: { orderBy: { minScore: "desc" } },
        behaviourTiers: { orderBy: { minScore: "desc" } },
      },
    });

    if (!record) {
      return DEFAULT_SPENDING_POWER_CONFIG;
    }

    return {
      affordability: {
        allocationPercentage: Number(record.allocationPercentage),
      },
      riskAdjustment: {
        tiers: record.riskTiers.map((tier) => ({
          minScore: tier.minScore,
          maxScore: tier.maxScore,
          riskTier: tier.riskTier as RiskTier,
          multiplier: Number(tier.multiplier),
          maximumExposureCap: Number(tier.maximumExposureCap),
          treatment: tier.treatment,
        })),
      },
      behaviouralAdjustment: {
        tiers: record.behaviourTiers.map((tier) => ({
          minScore: tier.minScore,
          maxScore: tier.maxScore,
          behaviourTier: tier.behaviourTier as RiskTier,
          multiplier: Number(tier.multiplier),
          treatment: tier.treatment,
        })),
      },
      maximumExposure: Number(record.maximumExposure),
    };
  }

  async resolveSpendingPowerConfig(
    useDatabase: boolean = false,
    config?: SpendingPowerConfig
  ): Promise<SpendingPowerConfig> {
    if (config) {
      return config;
    }

    if (useDatabase) {
      return this.fetchSpendingPowerConfigFromDb();
    }

    return DEFAULT_SPENDING_POWER_CONFIG;
  }

  async calculateSpendingPower(
    input: SpendingPowerInput,
    useDatabase: boolean = false,
    config?: SpendingPowerConfig
  ): Promise<SpendingPowerResult> {
    if (!Number.isFinite(input.disposableIncome)) {
      throw new Error("disposableIncome must be a valid number");
    }

    if (!Number.isFinite(input.riskScore)) {
      throw new Error("riskScore must be a valid number");
    }

    if (!Number.isFinite(input.behaviourScore)) {
      throw new Error("behaviourScore must be a valid number");
    }

    if (input.disposableIncome < 0) {
      throw new Error("disposableIncome cannot be negative");
    }

    const resolvedConfig = await this.resolveSpendingPowerConfig(useDatabase, config);

    const affordableMonthlyRepaymentCapacity = Math.max(
      0,
      input.disposableIncome * resolvedConfig.affordability.allocationPercentage
    );

    const riskAdjustment = this.getRiskAdjustment(input.riskScore, resolvedConfig);
    const riskAdjustedCapacity = affordableMonthlyRepaymentCapacity * riskAdjustment.multiplier;

    const behaviouralAdjustment = this.getBehaviouralAdjustment(
      input.behaviourScore,
      resolvedConfig
    );
    const behaviourAdjustedCapacity = riskAdjustedCapacity * behaviouralAdjustment.multiplier;

    const totalSpendingPower = Math.min(
      behaviourAdjustedCapacity,
      riskAdjustment.maximumExposureCap,
      resolvedConfig.maximumExposure
    );

    return {
      affordableMonthlyRepaymentCapacity,
      riskScore: input.riskScore,
      riskTier: riskAdjustment.riskTier,
      riskMultiplier: riskAdjustment.multiplier,
      riskAdjustedCapacity,
      behaviourScore: input.behaviourScore,
      behaviourTier: behaviouralAdjustment.behaviourTier,
      behaviourMultiplier: behaviouralAdjustment.multiplier,
      behaviourAdjustedCapacity,
      maximumExposureCap: riskAdjustment.maximumExposureCap,
      maximumExposure: resolvedConfig.maximumExposure,
      totalSpendingPower,
    };
  }

  determineEligibility(
    totalScore: number,
    existingLoanRepayment: number,
    estimatedMonthlyIncome: number
  ): EligibilityDeterminationResult {
    const safeTotalScore = Number(totalScore) || 0;
    const safeExistingLoanRepayment = Number(existingLoanRepayment) || 0;
    const safeIncome = Number(estimatedMonthlyIncome) || 0;

    const dtiRatio = Math.round(
      safeIncome > 0 ? (safeExistingLoanRepayment / safeIncome) * 100 : 0
    );
    // console.log('--------------------------------');
    // console.log('dtiRatio', dtiRatio);
    // console.log('safeTotalScore', safeTotalScore);
    // console.log('safeIncome', safeIncome);
    // console.log('safeExistingLoanRepayment', safeExistingLoanRepayment);
    const eligible = safeTotalScore >= 50 && dtiRatio <= 35 && safeIncome >= 30000;

    let riskLevel: EligibilityRiskLevel = "low";
    if (safeTotalScore < 50) riskLevel = "high";
    else if (safeTotalScore < 70) riskLevel = "medium";
    // console.log({ eligible, riskLevel, dtiRatio });
    // console.log('--------------------------------');
    return { eligible, riskLevel, dtiRatio };
  }

  incomeStabilitySelfAssessment(incomeMonths: number, dominantMonths: number): number {
    const safeIncomeMonths = Number(incomeMonths) || 0;
    const safeDominantMonths = Number(dominantMonths) || 0;

    if (safeIncomeMonths <= 0) return 0;

    const consistency = safeDominantMonths / safeIncomeMonths;

    if (consistency >= 0.85 && safeIncomeMonths >= 5) return 15;
    if (consistency >= 0.7 && safeIncomeMonths >= 4) return 12;
    if (consistency >= 0.5 && safeIncomeMonths >= 3) return 8;
    if (safeIncomeMonths >= 2) return 3;
    return 0;
  }

  netCashFlowSelfAssessment(incomeMonths: number, overdrafts: number): number {
    const safeIncomeMonths = Number(incomeMonths) || 0;
    const safeOverdrafts = Number(overdrafts) || 0;

    if (safeIncomeMonths <= 0) return 0;

    if (safeIncomeMonths >= 5 && safeOverdrafts <= 1) return 15;
    if (safeIncomeMonths >= 4 && safeOverdrafts <= 2) return 12;
    if (safeIncomeMonths >= 3 && safeOverdrafts <= 3) return 8;
    if (safeIncomeMonths >= 2) return 3;
    return 0;
  }

  liquidityBufferSelfAssessment(incomeMonths: number, overdrafts: number): number {
    const safeIncomeMonths = Number(incomeMonths) || 0;
    const safeOverdrafts = Number(overdrafts) || 0;

    if (safeIncomeMonths <= 0) return 0;

    if (safeOverdrafts === 0 && safeIncomeMonths >= 4) return 10;
    if (safeOverdrafts <= 1 && safeIncomeMonths >= 4) return 8;
    if (safeOverdrafts <= 2 && safeIncomeMonths >= 3) return 6;
    if (safeOverdrafts <= 3) return 4;
    if (safeOverdrafts <= 5) return 1;
    return 0;
  }

  riskFactorScoreSelfAssessment(totalFlags: number): number {
    if (totalFlags === 0) return 10;
    if (totalFlags <= 3) return 7;
    if (totalFlags <= 6) return 4;
    return 0;
  }

  overdraftScoreSelfAssessment(
    events: number,
    deepest: number,
    days: number,
    recent: boolean
  ): number {
    const safeEvents = Number(events) || 0;
    const safeDeepest = Number(deepest) || 0;
    const safeDays = Number(days) || 0;
    const safeRecent = recent === true;

    if (safeEvents === 0) return 10;

    if (safeEvents <= 2 && safeDeepest <= 5000 && safeDays <= 5 && safeRecent === false) return 7;

    if (safeEvents <= 4 || safeRecent === true) return 4;

    return 0;
  }
  // self assement scoring score max 100 points
  async selfAssessmentScoring(input: SelfAssessmentScoringInput) {
    const incomeRecurrentResult = await this.incomeRecurrent(input.incomeRecurrent);
    const incomeRecurrentScore = Number(incomeRecurrentResult?.score ?? 0) || 0;

    const incomeStabilityScore =
      Number(
        this.incomeStabilitySelfAssessment(
          input.incomeRecurrent?.incomeMonths,
          input.incomeRecurrent?.dominantSourceCount
        )
      ) || 0;
    const netCashFlowScore =
      Number(
        this.netCashFlowSelfAssessment(input.incomeRecurrent?.incomeMonths, input.overdraftCount)
      ) || 0;

    const liquidityBufferScore =
      Number(
        this.liquidityBufferSelfAssessment(
          input.incomeRecurrent?.incomeMonths,
          input.overdraftCount
        )
      ) || 0;

    const overdraftScore =
      Number(
        this.overdraftScoreSelfAssessment(
          input.overdraftEvents,
          input.overdraftDeepestNegativeBalance,
          input.overdraftNegativeDays,
          input.overdraftRecent
        )
      ) || 0;
    const creditBehaviorScore = Number(await this.creditBehaviorScore(input.creditHistory)) || 0;
    const riskFactorScore = Number(this.riskFactorScoreSelfAssessment(input.totalFlags)) || 0;

    const finalScore =
      incomeRecurrentScore +
      incomeStabilityScore +
      netCashFlowScore +
      liquidityBufferScore +
      overdraftScore +
      creditBehaviorScore +
      riskFactorScore;

    const eligibility = this.determineEligibility(
      finalScore,
      input.existingLoanRepayment,
      input.estimatedMonthlyIncome
    );

    return {
      finalScore,
      breakdown: {
        incomeRecurrentScore: { weight: 25, score: incomeRecurrentScore },
        incomeStabilityScore: { weight: 15, score: incomeStabilityScore },
        netCashFlowScore: { weight: 15, score: netCashFlowScore },
        liquidityBufferScore: { weight: 10, score: liquidityBufferScore },
        overdraftScore: { weight: 10, score: overdraftScore },
        creditBehaviorScore: { weight: 15, score: creditBehaviorScore },
        riskFactorScore: { weight: 10, score: riskFactorScore },
      },
      eligibility,
    };
  }
  /**
   * Calculate the income recurrent score max 25 points
   * @param input - The input data
   * @returns The income recurrent score
   */
  async incomeRecurrent(input: IncomeRecurrentInput) {
    const { incomeMonths, dominantSourceCount, isFiftMonth, isSixtMonth } = input;
    if (!isFiftMonth && !isSixtMonth) {
      return {
        recurrentCoverage: 0,
        recencyStrength: 0,
        sourceConsistency: 0,
        score: 0,
      };
    }
    const recurrentCoverage = incomeMonths / 6;
    const recencyStrength = (isFiftMonth ? 0.4 : 0) + (isSixtMonth ? 0.6 : 0);
    const sourceConsistency = dominantSourceCount / incomeMonths;
    const score =
      25 * (0.45 * recurrentCoverage + 0.3 * recencyStrength + 0.25 * sourceConsistency);

    return {
      recurrentCoverage,
      recencyStrength,
      sourceConsistency,
      score,
    };
  }

  /**
   * Calculate the income stability score max 15 points
   * @param input - The input data
   * @returns The income stability score
   */
  async incomeStability(input: IncomeStabilityInput) {
    const { monthlyIncomes, averageIncome } = input;
    if (monthlyIncomes.length === 0) {
      return 0;
    }

    const incomeRatio = (await this.standardDeviation(monthlyIncomes)) / averageIncome;

    let score = 0;

    if (incomeRatio <= 0.1) {
      score = 15;
    } else if (incomeRatio <= 0.2) {
      score = 12;
    } else if (incomeRatio <= 0.35) {
      score = 8;
    } else if (incomeRatio <= 0.5) {
      score = 3;
    } else {
      score = 0;
    }

    return score;
  }
  // net cash flow score max 15 points
  async netCashFlow(input: CashFlow) {
    const { monthlyNetCashFlow, positiveCount } = this.calculateNetCashFlow(input);
    let score = 0;
    if (positiveCount >= 5) {
      score = 15;
    } else if (positiveCount === 4) {
      score = 12;
    } else if (positiveCount === 3) {
      score = 8;
    } else if (positiveCount === 2) {
      score = 3;
    } else if (positiveCount === 1) {
      score = 3;
    } else {
      score = 0;
    }
    return score;
  }

  //liquidity buffer score max 10 points
  async liquidityBuffer(input: LiquidityBufferInput) {
    const months = input.months ?? [];
    const monthCount = months.length;

    if (monthCount === 0) {
      return {
        monthCount: 0,
        score: 0,
      };
    }
    //
    // count of pre income balance that is >0 for the month
    const preIncomeBalanceCount = months.reduce(
      (acc, m) => (m.preIncomeBalance > 0 ? acc + 1 : acc),
      0
    );
    //  count of month end balance that is >0 for the month
    const monthEndBalanceCount = months.reduce(
      (acc, m) => (m.monthEndBalance > 0 ? acc + 1 : acc),
      0
    );

    input.recurringIncomeExists =
      preIncomeBalanceCount > 3 && (input.estimatedMonthlyIncome ?? 0) > 0;

    if (!input.recurringIncomeExists && monthEndBalanceCount < 3) {
      return {
        monthCount: monthCount,
        score: 0,
      };
    }
    //
    const denom =
      input.recurringIncomeExists === true
        ? (input.estimatedMonthlyIncome ?? 0)
        : (input.averageMonthlyInflow ?? 0);

    const safeDenom = typeof denom === "number" && denom > 0 ? denom : 0;

    const monthlyRatios = months.map((m) => {
      if (safeDenom === 0) return 0;
      const numerator = input.recurringIncomeExists ? m.preIncomeBalance : m.monthEndBalance;
      if (typeof numerator !== "number" || !Number.isFinite(numerator)) return 0;
      return numerator / safeDenom;
    });

    const countAtOrAbove = (threshold: number) =>
      monthlyRatios.reduce((acc, r) => (r >= threshold ? acc + 1 : acc), 0);

    const monthsGte10pct = countAtOrAbove(0.1);
    const monthsGte5pct = countAtOrAbove(0.05);
    const monthsGte2pct = countAtOrAbove(0.02);
    const monthsLt2pct = monthlyRatios.reduce((acc, r) => (r < 0.02 ? acc + 1 : acc), 0);

    const zeroOrNegativePreIncomeMonths = input.recurringIncomeExists
      ? months.reduce((acc, m) => (m.preIncomeBalance <= 0 ? acc + 1 : acc), 0)
      : 0;

    // Spreadsheet rule: frequent zero/negative pre-income balance => score 0
    // Interpreting "frequent" as at least half the observed months.
    const frequentZeroOrNegativePreIncome =
      input.recurringIncomeExists && zeroOrNegativePreIncomeMonths >= Math.ceil(monthCount / 2);

    let score = 0;

    if (frequentZeroOrNegativePreIncome) {
      score = 0;
    } else if (monthsGte10pct >= 4) {
      // ≥ 10% in 4–6 months
      score = 10;
    } else if (monthsGte5pct >= 4) {
      // ≥ 5% in 4–6 months
      score = 8;
    } else if (monthsGte5pct === 3) {
      // ≥ 5% in 3 months
      score = 6;
    } else if (monthsGte2pct >= 3 && monthsGte2pct <= 4) {
      // ≥ 2% in 3–4 months
      score = 4;
    } else if (monthsLt2pct >= Math.ceil((monthCount * 2) / 3)) {
      // < 2% most months (interpreting "most" as ≥ 2/3 of observed months)
      score = 1;
    } else {
      // Default to the lowest non-zero bucket when not fitting other patterns.
      score = 1;
    }

    return {
      monthCount,
      score,
    };
  }

  // overdraft score max 10 points
  overdraftScore(events: number, deepest: number, days: number, recent: boolean): number {
    const safeEvents = Number(events) || 0;
    const safeDeepest = Number(deepest) || 0;
    const safeDays = Number(days) || 0;
    const safeRecent = recent === true;

    if (safeEvents === 0) return 10;

    if (safeEvents <= 2 && safeDeepest <= 5000 && safeDays <= 5 && safeRecent === false) return 7;

    if (safeEvents <= 4 || safeRecent === true) return 4;

    return 0;
  }

  // credit behavior score max 15 points
  async creditBehaviorScore(creditHistory: number) {
    let score = 0;
    if (creditHistory === 1) {
      score = 15;
    } else if (creditHistory === 2) {
      score = 10;
    } else if (creditHistory === 3) {
      score = 8;
    } else {
      score = 0;
    }
    return score;
  }
  // risk factor score max 10 points

  riskFactorScore(months: MonthlyScores): number {
    const { M1, M2, M3, M4, M5, M6 } = months;
    const sumAll = M1 + M2 + M3 + M4 + M5 + M6;
    const sumM1toM4 = M1 + M2 + M3 + M4;
    const sumM5toM6 = M5 + M6;

    // 1. Special rule: If M1:M4 > 6 AND M5+M6 = 0 → score 4
    if (sumM1toM4 > 6 && sumM5toM6 === 0) {
      return 4;
    }

    // 2. If total sum > 6 → score 0
    if (sumAll > 6) {
      return 0;
    }

    // 3. If M5 > 0 AND M6 > 0 → score 4
    if (M5 > 0 && M6 > 0) {
      return 4;
    }

    // 4. Normal scoring tiers
    if (sumAll === 0) {
      return 10;
    }

    if (sumAll <= 3) {
      return 7;
    }

    if (sumAll <= 6) {
      return 4;
    }

    // Fallback (should never be reached)
    return 0;
  }
  /**
   * Calculate the standard deviation of the data
   * @param data - The data
   * @returns The standard deviation
   */
  async standardDeviation(data: number[]): Promise<number> {
    const n = data.length;
    if (n === 0) return 0;
    const positiveData = data.filter((x) => typeof x === "number" && x > 0);
    if (positiveData.length < 4) return 0;

    const mean = data.reduce((sum, val) => sum + val, 0) / n;

    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;

    return Math.sqrt(variance);
  }

  calculateNetCashFlow(cashFlow: CashFlow): {
    monthlyNetCashFlow: Record<keyof inFlow, number>;
    positiveCount: number;
  } {
    const months = Object.keys(cashFlow.inFlow) as (keyof inFlow)[];

    const monthlyNetCashFlow = {} as Record<keyof inFlow, number>;
    let positiveCount = 0;

    for (const month of months) {
      const net = cashFlow.inFlow[month] - cashFlow.outflow[month];

      monthlyNetCashFlow[month] = net;

      if (net > 0) {
        positiveCount++;
      }
    }

    return {
      monthlyNetCashFlow,
      positiveCount,
    };
  }

  private createRepaymentPlan(
    firstInstallment: number,
    subsequentInstallment: number,
    numberOfInstallments: RepaymentInstallmentCount
  ): RepaymentPlan[] {
    return Array.from({ length: numberOfInstallments }, (_, index) => ({
      installmentNumber: index + 1,
      amount: index === 0 ? firstInstallment : subsequentInstallment,
      dueWeek: (index + 1) * 2,
    }));
  }

  calculateRepaymentPlan({
    loanAmount,
    monthlySpendingPower,
    numberOfInstallments,
    firstInstallment,
  }: RepaymentOptions): RepaymentPlan[] {
    if (!Number.isFinite(loanAmount) || loanAmount <= 0) {
      throw new Error("Loan amount must be greater than zero.");
    }

    if (!Number.isFinite(monthlySpendingPower) || monthlySpendingPower <= 0) {
      throw new Error("Monthly spending power must be greater than zero.");
    }

    if (![4, 6].includes(numberOfInstallments)) {
      throw new Error("Number of installments must be either 4 or 6.");
    }

    if (firstInstallment !== undefined) {
      if (!Number.isFinite(firstInstallment) || firstInstallment <= 0) {
        throw new Error("First installment must be greater than zero.");
      }

      if (firstInstallment >= loanAmount) {
        throw new Error("First installment must be less than the loan amount.");
      }
    }

    const maxSubsequentInstallment = monthlySpendingPower / 2;
    const normalInstallment = loanAmount / numberOfInstallments;
    const normalMonthlyRepayment = normalInstallment * 2;

    if (firstInstallment !== undefined) {
      const remainingBalance = loanAmount - firstInstallment;
      const subsequentInstallment = remainingBalance / (numberOfInstallments - 1);

      if (subsequentInstallment * 2 > monthlySpendingPower) {
        throw new Error(
          `First installment of ${firstInstallment} is not allowed. ` +
            `The resulting subsequent bi-weekly repayment ` +
            `of ${subsequentInstallment.toFixed(2)} ` +
            `would exceed the monthly spending power rule.`
        );
      }

      return this.createRepaymentPlan(
        firstInstallment,
        subsequentInstallment,
        numberOfInstallments
      );
    }

    if (normalMonthlyRepayment <= monthlySpendingPower) {
      return this.createRepaymentPlan(normalInstallment, normalInstallment, numberOfInstallments);
    }

    const subsequentInstallment = maxSubsequentInstallment;
    const calculatedFirstInstallment =
      loanAmount - subsequentInstallment * (numberOfInstallments - 1);

    return this.createRepaymentPlan(
      calculatedFirstInstallment,
      subsequentInstallment,
      numberOfInstallments
    );
  }

  monthlyRepayment(principal: number, rate: number, months: number): number {
    if (rate === 0) return principal / months;
    const factor = Math.pow(1 + rate, months);
    return (principal * rate * factor) / (factor - 1);
  }
  principalFromMonthlyRepayment(monthlyRepayment: number, rate: number, months: number): number {
    if (rate === 0) return monthlyRepayment * months;

    const factor = Math.pow(1 + rate, months);

    return (monthlyRepayment * (factor - 1)) / (rate * factor);
  }

  /**
   * Evaluate a financing request against repayment capacity and principal limits.
   * When `intendedUpfrontPayment` is omitted, the maximum financeable amount is used
   * and the required upfront payment is derived from it.
   */
  evaluateFinancing({
    productAmount,
    customerMaxRepayment,
    maxPrincipal,
    rate,
    months,
    intendedUpfrontPayment,
  }: FinancingEvaluationInput): FinancingEvaluationResult {
    // Maximum principal allowed based on monthly repayment capacity
    const maxPrincipalByRepayment = this.principalFromMonthlyRepayment(
      customerMaxRepayment,
      rate,
      months
    );

    // Actual maximum amount the customer can finance
    const maxFinanceAmount = Math.min(
      productAmount,
      maxPrincipal,
      maxPrincipalByRepayment
    );

    // Minimum upfront payment required to stay within the limit
    const minimumUpfrontRequired = Math.max(0, productAmount - maxFinanceAmount);

    // Customer provided an intended upfront payment
    if (intendedUpfrontPayment !== undefined) {
      if (intendedUpfrontPayment < 0) {
        return {
          status: "FAILED",
          reason: "INVALID_UPFRONT_PAYMENT",
          message: "Upfront payment cannot be negative.",
        };
      }

      if (intendedUpfrontPayment > productAmount) {
        return {
          status: "FAILED",
          reason: "INVALID_UPFRONT_PAYMENT",
          message: "Upfront payment cannot exceed the product amount.",
        };
      }

      const financeAmount = productAmount - intendedUpfrontPayment;
      const monthlyRepaymentAmount = this.monthlyRepayment(financeAmount, rate, months);

      if (financeAmount > maxFinanceAmount) {
        return {
          status: "FAILED",
          reason: "FINANCE_AMOUNT_EXCEEDS_LIMIT",
          productAmount,
          intendedUpfrontPayment,
          intendedFinanceAmount: financeAmount,
          maximumFinanceAmount: maxFinanceAmount,
          minimumUpfrontRequired,
          additionalUpfrontRequired: minimumUpfrontRequired - intendedUpfrontPayment,
          message:
            `You must pay at least ${minimumUpfrontRequired} upfront ` +
            `and can finance a maximum of ${maxFinanceAmount}.`,
        };
      }

      return {
        status: "PASSED",
        productAmount,
        upfrontPayment: intendedUpfrontPayment,
        financeAmount,
        monthlyRepayment: monthlyRepaymentAmount,
        maximumFinanceAmount: maxFinanceAmount,
        minimumUpfrontRequired,
        message: "The financing request is within the allowable limit.",
      };
    }

    // No upfront payment provided: finance the maximum allowable amount
    const calculatedFinanceAmount = maxFinanceAmount;
    const calculatedUpfrontPayment = productAmount - calculatedFinanceAmount;
    const calculatedMonthlyRepayment = this.monthlyRepayment(
      calculatedFinanceAmount,
      rate,
      months
    );

    return {
      status: "PASSED",
      productAmount,
      upfrontPayment: calculatedUpfrontPayment,
      financeAmount: calculatedFinanceAmount,
      monthlyRepayment: calculatedMonthlyRepayment,
      maximumFinanceAmount: maxFinanceAmount,
      minimumUpfrontRequired: calculatedUpfrontPayment,
      message:
        calculatedUpfrontPayment > 0
          ? `You need to pay ${calculatedUpfrontPayment} upfront and can finance ${calculatedFinanceAmount}.`
          : "The full product amount can be financed.",
    };
  }
}

export const scoreService = new ScoringService();
