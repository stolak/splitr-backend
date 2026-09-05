import { Request, Response } from "express";
import {
  scoreService,
  ScoringInput,
  SelfAssessmentScoringInput,
  OpenBankingInput,
  CreditBureauInput,
  MerchantRiskInput,
  FinalCustomerScoreInput,
  CustomerLenderType,
  SpendingPowerInput,
  SpendingPowerConfig,
  RepaymentOptions,
  RepaymentInstallmentCount,
  Tenor,
  MonthlyFlexTenor,
  FinancingProductType,
} from "../services/scoringService";

/**
 * @swagger
 * /api/v1/scoring/finance/by-product/calculate:
 *   post:
 *     summary: Finance calculation for either product type
 *     description: >
 *       Routes to the bi-weekly (Pay-in-N) or Monthly Flex finance calculation based on
 *       productType, so callers can use a single endpoint for both.
 *       BI_WEEKLY accepts a tenor of 4 or 6, divides the total repayment evenly across
 *       the installments and resolves defaults from PAY_IN_{tenor}; MONTHLY_FLEX accepts
 *       a tenor of 3 to 12, amortizes the installment and resolves defaults from
 *       MONTHLY_FLEX_{tenor}. The branch taken is echoed back as productType in the
 *       response. productType is matched case-insensitively and hyphens are accepted
 *       (e.g. bi-weekly).
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productType
 *               - purchaseAmount
 *               - tenor
 *             properties:
 *               productType:
 *                 type: string
 *                 enum: [BI_WEEKLY, MONTHLY_FLEX]
 *                 example: MONTHLY_FLEX
 *               purchaseAmount:
 *                 type: number
 *                 example: 1200
 *               tenor:
 *                 type: integer
 *                 description: 4 or 6 for BI_WEEKLY; 3 to 12 for MONTHLY_FLEX
 *                 example: 6
 *               partPayment:
 *                 type: number
 *                 description: Optional part payment; defaults to 0 and is added to the first installment
 *                 example: 300
 *               rate:
 *                 type: number
 *                 description: >
 *                   Optional rate as a percentage value. Defaults to the product
 *                   configuration rate for the resolved code.
 *                 example: 12.99
 *               minSp:
 *                 type: number
 *                 description: Optional; defaults to the product configuration minimumFinance
 *                 example: 350
 *               maxSp:
 *                 type: number
 *                 description: Optional; defaults to the product configuration maximumFinance
 *                 example: 30000
 *     responses:
 *       200:
 *         description: Finance calculation completed (status is passed or failed)
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/scoring/available-spending-power/by-product/calculate:
 *   post:
 *     summary: Calculate available spending power for either product type
 *     description: >
 *       Routes to the bi-weekly (Pay-in-N) or Monthly Flex spending power calculation
 *       based on productType, so callers can use a single endpoint for both.
 *       BI_WEEKLY accepts a tenure of 4 or 6 and resolves defaults from PAY_IN_{tenure};
 *       MONTHLY_FLEX accepts a tenure of 3 to 12 and resolves defaults from
 *       MONTHLY_FLEX_{tenure}. The branch taken is echoed back as productType in the
 *       response. productType is matched case-insensitively and hyphens are accepted
 *       (e.g. bi-weekly).
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productType
 *               - tenure
 *               - disposableIncome
 *               - affordabilityAllocationRate
 *               - riskMultiplier
 *               - behaviourMultiplier
 *               - totalPlatformExposure
 *             properties:
 *               productType:
 *                 type: string
 *                 enum: [BI_WEEKLY, MONTHLY_FLEX]
 *                 example: MONTHLY_FLEX
 *               tenure:
 *                 type: integer
 *                 description: 4 or 6 for BI_WEEKLY; 3 to 12 for MONTHLY_FLEX
 *                 example: 6
 *               disposableIncome:
 *                 type: number
 *                 description: Monthly disposable income
 *                 example: 2500
 *               affordabilityAllocationRate:
 *                 type: number
 *                 description: Share of disposable income allocated to repayments, as a decimal (e.g. 0.30)
 *                 example: 0.25
 *               riskMultiplier:
 *                 type: number
 *                 example: 1.25
 *               behaviourMultiplier:
 *                 type: number
 *                 example: 1.15
 *               totalPlatformExposure:
 *                 type: number
 *                 description: Customer's existing exposure across the platform
 *                 example: 500
 *               productRate:
 *                 type: number
 *                 description: >
 *                   Optional rate as a percentage value. Defaults to the product
 *                   configuration rate for the resolved code. Only used by MONTHLY_FLEX.
 *                 example: 12.99
 *               productMini:
 *                 type: number
 *                 description: Optional; defaults to the product configuration minimumFinance
 *                 example: 350
 *               productMax:
 *                 type: number
 *                 description: Optional; defaults to the product configuration maximumFinance
 *                 example: 30000
 *     responses:
 *       200:
 *         description: Spending power calculated (status is passed or failed)
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/scoring/available-spending-power/monthly-flex/calculate:
 *   post:
 *     summary: Calculate the spending power available for a Monthly Flex product
 *     description: >
 *       Monthly Flex variant with a tenure of 3 to 12 months. The base affordability is
 *       the principal that the customer's monthly affordability can amortize over the
 *       tenure, then scaled by the risk and behaviour multipliers, capped at the product
 *       maximum and reduced by the customer's existing platform exposure.
 *       productRate, productMini and productMax are optional: any that are omitted are
 *       read from the MONTHLY_FLEX_{tenure} product configuration (e.g. tenure 6 maps to
 *       MONTHLY_FLEX_6), taking rate, minimumFinance and maximumFinance respectively.
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenure
 *               - disposableIncome
 *               - affordabilityAllocationRate
 *               - riskMultiplier
 *               - behaviourMultiplier
 *               - totalPlatformExposure
 *             properties:
 *               tenure:
 *                 type: integer
 *                 description: Number of months, from 3 to 12
 *                 minimum: 3
 *                 maximum: 12
 *                 example: 6
 *               disposableIncome:
 *                 type: number
 *                 description: Monthly disposable income
 *                 example: 2500
 *               affordabilityAllocationRate:
 *                 type: number
 *                 description: Share of disposable income allocated to repayments, as a decimal (e.g. 0.30)
 *                 example: 0.25
 *               riskMultiplier:
 *                 type: number
 *                 example: 1.25
 *               behaviourMultiplier:
 *                 type: number
 *                 example: 1.15
 *               totalPlatformExposure:
 *                 type: number
 *                 description: Customer's existing exposure across the platform
 *                 example: 500
 *               productRate:
 *                 type: number
 *                 description: >
 *                   Optional annual rate as a percentage value (e.g. 12.99 for 12.99%).
 *                   Defaults to the MONTHLY_FLEX_{tenure} product configuration rate.
 *                 example: 12.99
 *               productMini:
 *                 type: number
 *                 description: >
 *                   Optional minimum finance amount. Defaults to the product
 *                   configuration minimumFinance for this tenure.
 *                 example: 350
 *               productMax:
 *                 type: number
 *                 description: >
 *                   Optional maximum finance amount. Defaults to the product
 *                   configuration maximumFinance for this tenure.
 *                 example: 30000
 *     responses:
 *       200:
 *         description: Spending power calculated (status is passed or failed)
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/available-spending-power/calculate:
 *   post:
 *     summary: Calculate the spending power available for a Pay-in-N product
 *     description: >
 *       Derives the weekly and bi-weekly affordability from disposable income and the
 *       affordability allocation rate, scales it by the risk and behaviour multipliers,
 *       caps it at the product maximum and subtracts the customer's existing platform
 *       exposure. Fails when the result falls below the product minimum.
 *       productMini and productMax are optional: either one that is omitted is read from
 *       the product configuration for the tenure (tenure 4 maps to PAY_IN_4, tenure 6 to
 *       PAY_IN_6), taking minimumFinance and maximumFinance respectively.
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenure
 *               - disposableIncome
 *               - affordabilityAllocationRate
 *               - riskMultiplier
 *               - behaviourMultiplier
 *               - totalPlatformExposure
 *             properties:
 *               tenure:
 *                 type: integer
 *                 enum: [4, 6]
 *                 example: 4
 *               disposableIncome:
 *                 type: number
 *                 description: Monthly disposable income
 *                 example: 2500
 *               affordabilityAllocationRate:
 *                 type: number
 *                 description: Share of disposable income allocated to repayments, as a decimal (e.g. 0.30)
 *                 example: 0.25
 *               riskMultiplier:
 *                 type: number
 *                 example: 1.25
 *               behaviourMultiplier:
 *                 type: number
 *                 example: 1.15
 *               totalPlatformExposure:
 *                 type: number
 *                 description: Customer's existing exposure across the platform
 *                 example: 500
 *               productRate:
 *                 type: number
 *                 description: Optional; accepted for payload symmetry but not used by this calculation
 *                 example: 0
 *               productMini:
 *                 type: number
 *                 description: >
 *                   Optional minimum finance amount. Defaults to the product
 *                   configuration minimumFinance for this tenure.
 *                 example: 100
 *               productMax:
 *                 type: number
 *                 description: >
 *                   Optional maximum finance amount. Defaults to the product
 *                   configuration maximumFinance for this tenure.
 *                 example: 2500
 *     responses:
 *       200:
 *         description: Spending power calculated (status is passed or failed)
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/scoring/finance/monthly-flex/calculate:
 *   post:
 *     summary: Monthly Flex finance calculation (3 to 12 month tenor)
 *     description: >
 *       Applies the same spending power band rules as /finance/calculate, but the tenor
 *       runs from 3 to 12 months and the periodic installment is amortized using the
 *       monthly repayment formula. The part payment is added to the first installment.
 *       rate, minSp and maxSp are optional: any of them that is omitted is read from the
 *       MONTHLY_FLEX_{tenor} product configuration (e.g. tenor 6 maps to MONTHLY_FLEX_6),
 *       taking rate, minimumFinance and maximumFinance respectively.
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseAmount
 *               - tenor
 *             properties:
 *               purchaseAmount:
 *                 type: number
 *                 example: 1200
 *               partPayment:
 *                 type: number
 *                 description: Optional part payment; defaults to 0 and is added to the first installment
 *                 example: 300
 *               tenor:
 *                 type: integer
 *                 description: Number of months, from 3 to 12
 *                 minimum: 3
 *                 maximum: 12
 *                 example: 6
 *               rate:
 *                 type: number
 *                 description: >
 *                   Optional rate as a percentage value (e.g. 12.99 for 12.99%).
 *                   Defaults to the MONTHLY_FLEX_{tenor} product configuration rate.
 *                 example: 12.99
 *               minSp:
 *                 type: number
 *                 description: >
 *                   Optional minimum spending power. Defaults to the product
 *                   configuration minimumFinance for this tenor.
 *                 example: 350
 *               maxSp:
 *                 type: number
 *                 description: >
 *                   Optional maximum spending power. Defaults to the product
 *                   configuration maximumFinance for this tenor.
 *                 example: 30000
 *     responses:
 *       200:
 *         description: Finance calculation completed (status is passed or failed)
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/finance/calculate:
 *   post:
 *     summary: Validate a purchase against the spending power band and build the installment schedule
 *     description: >
 *       Checks the purchase amount and optional part payment against the customer's
 *       minimum and maximum spending power. When the financed amount falls inside the
 *       band, returns the total repayment, the periodic installment and the schedule
 *       (the part payment is added to the first installment). When it falls outside the
 *       band, returns the minimum part payment required or the maximum part payment allowed.
 *       rate, minSp and maxSp are optional: any of them that is omitted is read from the
 *       product configuration for the tenor (tenor 4 maps to PAY_IN_4, tenor 6 to PAY_IN_6),
 *       taking rate, minimumFinance and maximumFinance respectively.
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseAmount
 *               - tenor
 *             properties:
 *               purchaseAmount:
 *                 type: number
 *                 example: 1200
 *               partPayment:
 *                 type: number
 *                 description: Optional part payment; defaults to 0 and is added to the first installment
 *                 example: 300
 *               tenor:
 *                 type: integer
 *                 enum: [4, 6]
 *                 example: 4
 *               rate:
 *                 type: number
 *                 description: >
 *                   Optional rate as a percentage value (e.g. 2.5 for 2.5%).
 *                   Defaults to the product configuration rate for this tenor.
 *                 example: 2.5
 *               minSp:
 *                 type: number
 *                 description: >
 *                   Optional minimum spending power. Defaults to the product
 *                   configuration minimumFinance for this tenor.
 *                 example: 500
 *               maxSp:
 *                 type: number
 *                 description: >
 *                   Optional maximum spending power. Defaults to the product
 *                   configuration maximumFinance for this tenor.
 *                 example: 1000
 *     responses:
 *       200:
 *         description: Finance calculation completed (status is passed or failed)
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/financing/evaluate:
 *   post:
 *     summary: Evaluate a financing request against repayment capacity and principal limits
 *     description: >
 *       Determines the maximum financeable amount from the product amount, the customer's
 *       maximum monthly repayment capacity and the maximum allowed principal.
 *       When intendedUpfrontPayment is provided, the request is validated against that limit;
 *       otherwise the maximum financeable amount is used and the required upfront payment
 *       is derived from it.
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productAmount
 *               - customerMaxRepayment
 *               - maxPrincipal
 *               - rate
 *               - months
 *             properties:
 *               productAmount:
 *                 type: number
 *                 example: 500000
 *               customerMaxRepayment:
 *                 type: number
 *                 description: Maximum monthly repayment the customer can afford
 *                 example: 40000
 *               maxPrincipal:
 *                 type: number
 *                 description: Maximum principal the customer is allowed to finance
 *                 example: 450000
 *               rate:
 *                 type: number
 *                 description: Periodic interest rate as a decimal (e.g. 0.075 for 7.5%)
 *                 example: 0.075
 *               months:
 *                 type: integer
 *                 example: 12
 *               intendedUpfrontPayment:
 *                 type: number
 *                 description: Optional upfront payment the customer intends to make
 *                 example: 100000
 *     responses:
 *       200:
 *         description: Financing evaluation completed (status is PASSED or FAILED)
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/principal/calculate:
 *   post:
 *     summary: Calculate loan principal from a monthly repayment
 *     description: >
 *       Inverse of the amortization formula. Derives the affordable principal from a
 *       monthly repayment, periodic interest rate, and number of months.
 *       When rate is 0, returns monthlyRepayment * months.
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monthlyRepayment
 *               - rate
 *               - months
 *             properties:
 *               monthlyRepayment:
 *                 type: number
 *                 example: 43378.86
 *               rate:
 *                 type: number
 *                 description: Periodic interest rate as a decimal (e.g. 0.075 for 7.5%)
 *                 example: 0.075
 *               months:
 *                 type: integer
 *                 example: 12
 *     responses:
 *       200:
 *         description: Principal calculated successfully
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/monthly-repayment/calculate:
 *   post:
 *     summary: Calculate monthly loan repayment (amortization)
 *     description: >
 *       Computes the fixed monthly repayment for a principal, periodic interest rate,
 *       and number of months. When rate is 0, returns principal / months.
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - principal
 *               - rate
 *               - months
 *             properties:
 *               principal:
 *                 type: number
 *                 example: 500000
 *               rate:
 *                 type: number
 *                 description: Periodic interest rate as a decimal (e.g. 0.075 for 7.5%)
 *                 example: 0.075
 *               months:
 *                 type: integer
 *                 example: 12
 *     responses:
 *       200:
 *         description: Monthly repayment calculated successfully
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/repayment-plan/calculate:
 *   post:
 *     summary: Calculate bi-weekly repayment plan
 *     description: >
 *       Builds a 4- or 6-installment bi-weekly repayment schedule from loan amount
 *       and monthly spending power. Optionally accepts an intended first installment.
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loanAmount
 *               - monthlySpendingPower
 *               - numberOfInstallments
 *             properties:
 *               loanAmount:
 *                 type: number
 *                 example: 1200
 *               monthlySpendingPower:
 *                 type: number
 *                 example: 400
 *               numberOfInstallments:
 *                 type: integer
 *                 enum: [4, 6]
 *                 example: 4
 *               firstInstallment:
 *                 type: number
 *                 example: 450
 *     responses:
 *       200:
 *         description: Repayment plan calculated successfully
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/spending-power/calculate:
 *   post:
 *     summary: Calculate spending power
 *     description: >
 *       Computes affordable repayment capacity, applies risk and behavioural
 *       multipliers from configurable tiers, then caps at maximum exposure.
 *       Uses DEFAULT_SPENDING_POWER_CONFIG unless useDatabase is true
 *       (loads from SpendingPowerConfig) or an inline config override is provided.
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - disposableIncome
 *               - riskScore
 *               - behaviourScore
 *             properties:
 *               disposableIncome:
 *                 type: number
 *                 example: 4000
 *               riskScore:
 *                 type: number
 *                 example: 82
 *               behaviourScore:
 *                 type: number
 *                 example: 75
 *               useDatabase:
 *                 type: boolean
 *                 description: When true, load spending power config from the database
 *                 example: false
 *               config:
 *                 $ref: '#/components/schemas/SpendingPowerConfig'
 *     responses:
 *       200:
 *         description: Spending power calculated successfully
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/bri/calculate:
 *   post:
 *     summary: Calculate Behavioural Repayment Intelligence (BRI) score
 *     description: >
 *       First-time customers receive a neutral score of 0.
 *       Existing customers use (On-Time Payment × 60%) + (ACH Success × 40%).
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isExistingCustomer
 *               - onTimePaymentRatio
 *               - achSuccessRate
 *             properties:
 *               isExistingCustomer:
 *                 type: boolean
 *                 example: true
 *               onTimePaymentRatio:
 *                 type: number
 *                 description: Percentage of on-time payments (0–100+)
 *                 example: 97
 *               achSuccessRate:
 *                 type: number
 *                 description: ACH success rate percentage (0–100+)
 *                 example: 100
 *     responses:
 *       200:
 *         description: BRI score calculated successfully
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/final/calculate:
 *   post:
 *     summary: Calculate final customer score
 *     description: >
 *       Combines open banking, credit bureau, merchant risk, and BRI scores
 *       using first-time lender or returning customer weights. BRI currently
 *       uses a default value until a formula is defined.
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinalCustomerScoreInput'
 *     responses:
 *       200:
 *         description: Final customer score calculated successfully
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/merchant-risk/calculate:
 *   post:
 *     summary: Calculate merchant risk score
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MerchantRiskInput'
 *     responses:
 *       200:
 *         description: Merchant risk score calculated successfully
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
 *                   example: Merchant risk score calculated successfully
 *                 data:
 *                   $ref: '#/components/schemas/MerchantRiskScoreResult'
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/credit-bureau/calculate:
 *   post:
 *     summary: Calculate credit bureau score
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreditBureauInput'
 *     responses:
 *       200:
 *         description: Credit bureau score calculated successfully
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
 *                   example: Credit bureau score calculated successfully
 *                 data:
 *                   $ref: '#/components/schemas/CreditBureauScoreResult'
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/open-banking/calculate:
 *   post:
 *     summary: Calculate open banking score
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OpenBankingInput'
 *     responses:
 *       200:
 *         description: Open banking score calculated successfully
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
 *                   example: Open banking score calculated successfully
 *                 data:
 *                   $ref: '#/components/schemas/OpenBankingScoreResult'
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/calculate:
 *   post:
 *     summary: Calculate composite scoring result
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScoringInput'
 *     responses:
 *       200:
 *         description: Scoring calculated successfully
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
 *                   example: Scoring calculated successfully
 *                 data:
 *                   $ref: '#/components/schemas/ScoringCalculateResult'
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/self-assessment/calculate:
 *   post:
 *     summary: Calculate self-assessment scoring result
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SelfAssessmentScoringInput'
 *     responses:
 *       200:
 *         description: Self-assessment scoring calculated successfully
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
 *                   example: Self-assessment scoring calculated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     finalScore:
 *                       type: number
 *                       example: 68
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         incomeRecurrentScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         incomeStabilityScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         netCashFlowScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         liquidityBufferScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         overdraftScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         creditBehaviorScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         riskFactorScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                     eligibility:
 *                       $ref: '#/components/schemas/EligibilityDeterminationResult'
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/eligibility/determine:
 *   post:
 *     summary: Determine score eligibility and risk level
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DetermineEligibilityInput'
 *     responses:
 *       200:
 *         description: Eligibility determined successfully
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
 *                   example: Eligibility determined successfully
 *                 data:
 *                   $ref: '#/components/schemas/EligibilityDeterminationResult'
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     DetermineEligibilityInput:
 *       type: object
 *       required:
 *         - totalScore
 *         - existingLoanRepayment
 *         - estimatedMonthlyIncome
 *       properties:
 *         totalScore:
 *           type: number
 *           description: Aggregate applicant score used for eligibility check
 *           example: 68
 *         existingLoanRepayment:
 *           type: number
 *           description: Existing monthly loan repayment amount
 *           example: 35000
 *         estimatedMonthlyIncome:
 *           type: number
 *           description: Estimated monthly income used for DTI calculation
 *           example: 180000
 *     OpenBankingInput:
 *       type: object
 *       required:
 *         - monthlyIncome
 *         - incomeStabilityVariance
 *         - netCashFlowPercentage
 *         - liquidityMonths
 *         - nsfEvents
 *         - overdraftFrequency
 *         - loanBurdenPercentage
 *       properties:
 *         monthlyIncome:
 *           type: number
 *           example: 6500
 *         incomeStabilityVariance:
 *           type: number
 *           example: 12
 *         netCashFlowPercentage:
 *           type: number
 *           example: 28
 *         liquidityMonths:
 *           type: number
 *           example: 3
 *         nsfEvents:
 *           type: number
 *           example: 0
 *         overdraftFrequency:
 *           type: number
 *           example: 1
 *         loanBurdenPercentage:
 *           type: number
 *           example: 15
 *     OpenBankingScoreComponent:
 *       type: object
 *       properties:
 *         variable:
 *           type: string
 *           example: Monthly Income
 *         rawScore:
 *           type: number
 *           example: 8
 *         weight:
 *           type: number
 *           example: 15
 *         weightedScore:
 *           type: number
 *           example: 1.2
 *     OpenBankingScoreResult:
 *       type: object
 *       properties:
 *         totalScore:
 *           type: number
 *           example: 7.85
 *         components:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OpenBankingScoreComponent'
 *     CreditBureauInput:
 *       type: object
 *       required:
 *         - creditScore
 *         - utilizationPercentage
 *         - delinquencies24Months
 *         - collections
 *         - hardInquiries12Months
 *         - bankruptcy
 *       properties:
 *         creditScore:
 *           type: number
 *           example: 720
 *         utilizationPercentage:
 *           type: number
 *           example: 35
 *         delinquencies24Months:
 *           type: number
 *           example: 1
 *         collections:
 *           type: string
 *           enum: [NONE, PAID, ACTIVE]
 *           example: NONE
 *         hardInquiries12Months:
 *           type: number
 *           example: 3
 *         bankruptcy:
 *           type: string
 *           enum: [NONE, DISCHARGED_OVER_5_YEARS, ACTIVE_OR_RECENT]
 *           example: NONE
 *     CreditBureauComponent:
 *       type: object
 *       properties:
 *         variable:
 *           type: string
 *           example: Credit Score
 *         rawScore:
 *           type: number
 *           example: 8
 *         weight:
 *           type: number
 *           example: 35
 *         weightedScore:
 *           type: number
 *           example: 2.8
 *     CreditBureauScoreResult:
 *       type: object
 *       properties:
 *         rawWeightedScore:
 *           type: number
 *           example: 8.35
 *         score:
 *           type: number
 *           example: 83.5
 *         components:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreditBureauComponent'
 *     MerchantRiskInput:
 *       type: object
 *       required:
 *         - merchantCategory
 *         - merchantCategoryScore
 *         - purchaseUtilizationPercentage
 *       properties:
 *         merchantCategory:
 *           type: string
 *           example: HEALTHCARE
 *         merchantCategoryScore:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           example: 10
 *         purchaseUtilizationPercentage:
 *           type: number
 *           example: 35
 *     MerchantRiskComponent:
 *       type: object
 *       properties:
 *         variable:
 *           type: string
 *           example: Merchant Category Risk
 *         rawScore:
 *           type: number
 *           example: 10
 *         weight:
 *           type: number
 *           example: 60
 *         weightedScore:
 *           type: number
 *           example: 6
 *     MerchantRiskScoreResult:
 *       type: object
 *       properties:
 *         score:
 *           type: number
 *           example: 9.2
 *         components:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MerchantRiskComponent'
 *     FinalCustomerScoreInput:
 *       type: object
 *       required:
 *         - customerType
 *         - openBanking
 *         - creditBureau
 *         - merchantRisk
 *       properties:
 *         customerType:
 *           type: string
 *           enum: [FIRST_TIME_LENDER, RETURNING_CUSTOMER]
 *           example: FIRST_TIME_LENDER
 *         openBanking:
 *           $ref: '#/components/schemas/OpenBankingInput'
 *         creditBureau:
 *           $ref: '#/components/schemas/CreditBureauInput'
 *         merchantRisk:
 *           $ref: '#/components/schemas/MerchantRiskInput'
 *         onTimePaymentRatio:
 *           type: number
 *           description: Required for RETURNING_CUSTOMER
 *           example: 97
 *         achSuccessRate:
 *           type: number
 *           description: Required for RETURNING_CUSTOMER
 *           example: 100
 *     SpendingPowerConfig:
 *       type: object
 *       properties:
 *         affordability:
 *           type: object
 *           properties:
 *             allocationPercentage:
 *               type: number
 *               example: 0.3
 *         riskAdjustment:
 *           type: object
 *           properties:
 *             tiers:
 *               type: array
 *               items:
 *                 type: object
 *         behaviouralAdjustment:
 *           type: object
 *           properties:
 *             tiers:
 *               type: array
 *               items:
 *                 type: object
 *         maximumExposure:
 *           type: number
 *           example: 500000
 *     WeightedScore:
 *       type: object
 *       required:
 *         - weight
 *         - score
 *       properties:
 *         weight:
 *           type: number
 *           example: 10
 *         score:
 *           type: number
 *           example: 7
 *     EligibilityDeterminationResult:
 *       type: object
 *       required:
 *         - eligible
 *         - riskLevel
 *         - dtiRatio
 *       properties:
 *         eligible:
 *           type: boolean
 *           example: true
 *         riskLevel:
 *           type: string
 *           enum: [high, medium, low]
 *           example: medium
 *         dtiRatio:
 *           type: number
 *           example: 16.67
 *     IncomeRecurrentInput:
 *       type: object
 *       required:
 *         - incomeMonths
 *         - dominantSourceCount
 *         - isFiftMonth
 *         - isSixtMonth
 *       properties:
 *         incomeMonths:
 *           type: number
 *           example: 5
 *         dominantSourceCount:
 *           type: number
 *           example: 4
 *         isFiftMonth:
 *           type: boolean
 *           example: true
 *         isSixtMonth:
 *           type: boolean
 *           example: true
 *     IncomeStabilityInput:
 *       type: object
 *       required:
 *         - averageIncome
 *         - monthlyIncomes
 *       properties:
 *         averageIncome:
 *           type: number
 *           example: 250000
 *         monthlyIncomes:
 *           type: array
 *           items:
 *             type: number
 *           example: [220000, 240000, 250000, 255000, 260000, 275000]
 *     LiquidityBufferMonthSnapshot:
 *       type: object
 *       required:
 *         - preIncomeBalance
 *         - monthEndBalance
 *       properties:
 *         preIncomeBalance:
 *           type: number
 *           example: 30000
 *         monthEndBalance:
 *           type: number
 *           example: 45000
 *     LiquidityBufferInput:
 *       type: object
 *       required:
 *         - months
 *         - recurringIncomeExists
 *       properties:
 *         months:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LiquidityBufferMonthSnapshot'
 *         recurringIncomeExists:
 *           type: boolean
 *           example: true
 *         estimatedMonthlyIncome:
 *           type: number
 *           example: 250000
 *         averageMonthlyInflow:
 *           type: number
 *           example: 230000
 *     MonthlyScores:
 *       type: object
 *       required:
 *         - M1
 *         - M2
 *         - M3
 *         - M4
 *         - M5
 *         - M6
 *       properties:
 *         M1:
 *           type: number
 *           example: 0
 *         M2:
 *           type: number
 *           example: 1
 *         M3:
 *           type: number
 *           example: 0
 *         M4:
 *           type: number
 *           example: 2
 *         M5:
 *           type: number
 *           example: 0
 *         M6:
 *           type: number
 *           example: 0
 *     IncomeRecurrentScoreDetail:
 *       type: object
 *       properties:
 *         recurrentCoverage:
 *           type: number
 *           example: 0.83
 *         recencyStrength:
 *           type: number
 *           example: 1
 *         sourceConsistency:
 *           type: number
 *           example: 0.8
 *         score:
 *           type: number
 *           example: 18.5
 *     LiquidityBufferScoreDetail:
 *       type: object
 *       properties:
 *         monthCount:
 *           type: number
 *           example: 6
 *         score:
 *           type: number
 *           example: 8
 *     ScoringBreakdown:
 *       type: object
 *       properties:
 *         incomeRecurrentScore:
 *           $ref: '#/components/schemas/WeightedScore'
 *         incomeStabilityScore:
 *           $ref: '#/components/schemas/WeightedScore'
 *         netCashFlowScore:
 *           $ref: '#/components/schemas/WeightedScore'
 *         liquidityBufferScore:
 *           $ref: '#/components/schemas/WeightedScore'
 *         overdraftScore:
 *           $ref: '#/components/schemas/WeightedScore'
 *         creditBehaviorScore:
 *           $ref: '#/components/schemas/WeightedScore'
 *         riskFactorScore:
 *           $ref: '#/components/schemas/WeightedScore'
 *     ScoringCalculateResult:
 *       type: object
 *       required:
 *         - finalScore
 *         - eligibility
 *         - eligible
 *         - breakdown
 *         - details
 *       properties:
 *         finalScore:
 *           type: number
 *           example: 74
 *         eligibility:
 *           type: number
 *           description: Tier from final score (0, 0.5, 0.75, or 1)
 *           enum: [0, 0.5, 0.75, 1]
 *           example: 1
 *         eligible:
 *           $ref: '#/components/schemas/EligibilityDeterminationResult'
 *           description: Debt-to-income and score-based eligibility (nested boolean `eligible`)
 *         breakdown:
 *           $ref: '#/components/schemas/ScoringBreakdown'
 *         details:
 *           type: object
 *           required:
 *             - incomeRecurrent
 *             - liquidityBuffer
 *           properties:
 *             incomeRecurrent:
 *               $ref: '#/components/schemas/IncomeRecurrentScoreDetail'
 *             liquidityBuffer:
 *               $ref: '#/components/schemas/LiquidityBufferScoreDetail'
 *     ScoringInput:
 *       type: object
 *       required:
 *         - incomeRecurrent
 *         - incomeStability
 *         - netCashFlowPositiveCount
 *         - liquidityBuffer
 *         - creditHistory
 *         - riskFactor
 *         - existingLoanRepayment
 *       properties:
 *         incomeRecurrent:
 *           $ref: '#/components/schemas/IncomeRecurrentInput'
 *         incomeStability:
 *           $ref: '#/components/schemas/IncomeStabilityInput'
 *         netCashFlowPositiveCount:
 *           type: number
 *           description: Number of months (in the observed window) with positive net cash flow
 *           example: 4
 *         liquidityBuffer:
 *           $ref: '#/components/schemas/LiquidityBufferInput'
 *         creditHistory:
 *           type: number
 *           description: Bucket 1 (best) through 3 (weak)
 *           example: 2
 *         riskFactor:
 *           $ref: '#/components/schemas/MonthlyScores'
 *         overdraftEvents:
 *           type: number
 *           description: Optional; defaults treated as 0 when omitted
 *           example: 1
 *         overdraftDeepestNegativeBalance:
 *           type: number
 *           example: 2000
 *         overdraftNegativeDays:
 *           type: number
 *           example: 3
 *         overdraftRecent:
 *           type: boolean
 *           description: Optional. Whether overdraft occurred in the last 2 months
 *           example: false
 *         existingLoanRepayment:
 *           type: number
 *           description: Existing monthly loan repayment (₦), used for eligibility
 *           example: 20000
 *         incomeClassification:
 *           type: string
 *           description: Optional income classification label (if available)
 *           example: "salaried"
 *         cashFlow:
 *           $ref: '#/components/schemas/CashFlow'
 *         loanRepayment:
 *           $ref: '#/components/schemas/LoanRepayment'
 *         numberOfUniquesNegativeBalances:
 *           $ref: '#/components/schemas/NumberOfUniquesNegativeBalances'
 *     CashFlow:
 *       type: object
 *       required:
 *         - inFlow
 *         - outflow
 *       properties:
 *         inFlow:
 *           $ref: '#/components/schemas/MonthlyScores'
 *         outflow:
 *           $ref: '#/components/schemas/MonthlyScores'
 *     LoanRepayment:
 *       type: object
 *       required:
 *         - M1
 *         - M2
 *         - M3
 *         - M4
 *         - M5
 *         - M6
 *       properties:
 *         M1: { type: number, example: 0 }
 *         M2: { type: number, example: 0 }
 *         M3: { type: number, example: 0 }
 *         M4: { type: number, example: 0 }
 *         M5: { type: number, example: 0 }
 *         M6: { type: number, example: 0 }
 *     NumberOfUniquesNegativeBalances:
 *       type: object
 *       required:
 *         - M1
 *         - M2
 *         - M3
 *         - M4
 *         - M5
 *         - M6
 *       properties:
 *         M1: { type: number, example: 0 }
 *         M2: { type: number, example: 0 }
 *         M3: { type: number, example: 0 }
 *         M4: { type: number, example: 0 }
 *         M5: { type: number, example: 0 }
 *         M6: { type: number, example: 0 }
 *     SelfAssessmentScoringInput:
 *       type: object
 *       required:
 *         - incomeRecurrent
 *         - overdraftCount
 *         - overdraftEvents
 *         - overdraftDeepestNegativeBalance
 *         - overdraftNegativeDays
 *         - overdraftRecent
 *         - creditHistory
 *         - totalFlags
 *         - estimatedMonthlyIncome
 *         - existingLoanRepayment
 *       properties:
 *         incomeRecurrent:
 *           $ref: '#/components/schemas/IncomeRecurrentInput'
 *         overdraftCount:
 *           type: number
 *           example: 1
 *         overdraftEvents:
 *           type: number
 *           example: 1
 *         overdraftDeepestNegativeBalance:
 *           type: number
 *           example: 2000
 *         overdraftNegativeDays:
 *           type: number
 *           example: 3
 *         overdraftRecent:
 *           type: boolean
 *           example: false
 *         creditHistory:
 *           type: number
 *           example: 2
 *         totalFlags:
 *           type: number
 *           description: Count of checked risk flags (0-6)
 *           example: 2
 *         estimatedMonthlyIncome:
 *           type: number
 *           example: 120000
 *         existingLoanRepayment:
 *           type: number
 *           example: 20000
 */
export class ScoringController {
  async calculateOpenBankingScore(req: Request, res: Response) {
    try {
      const input: OpenBankingInput = req.body;

      if (!input || typeof input !== "object") {
        return res.status(400).json({
          success: false,
          message: "Request body is required",
        });
      }

      const requiredFields: (keyof OpenBankingInput)[] = [
        "monthlyIncome",
        "incomeStabilityVariance",
        "netCashFlowPercentage",
        "liquidityMonths",
        "nsfEvents",
        "overdraftFrequency",
        "loanBurdenPercentage",
      ];

      for (const field of requiredFields) {
        if (typeof input[field] !== "number") {
          return res.status(400).json({
            success: false,
            message: `${field} is required and must be a number`,
          });
        }
      }

      const result = scoreService.calculateOpenBankingScore(input);

      return res.status(200).json({
        success: true,
        message: "Open banking score calculated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating open banking score:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate open banking score",
      });
    }
  }

  async calculateCreditBureauScore(req: Request, res: Response) {
    try {
      const input: CreditBureauInput = req.body;

      if (!input || typeof input !== "object") {
        return res.status(400).json({
          success: false,
          message: "Request body is required",
        });
      }

      const numberFields: (keyof CreditBureauInput)[] = [
        "creditScore",
        "utilizationPercentage",
        "delinquencies24Months",
        "hardInquiries12Months",
      ];

      for (const field of numberFields) {
        if (typeof input[field] !== "number") {
          return res.status(400).json({
            success: false,
            message: `${field} is required and must be a number`,
          });
        }
      }

      const validCollections = ["NONE", "PAID", "ACTIVE"];
      if (!validCollections.includes(input.collections)) {
        return res.status(400).json({
          success: false,
          message: "collections must be one of NONE, PAID, ACTIVE",
        });
      }

      const validBankruptcy = ["NONE", "DISCHARGED_OVER_5_YEARS", "ACTIVE_OR_RECENT"];
      if (!validBankruptcy.includes(input.bankruptcy)) {
        return res.status(400).json({
          success: false,
          message: "bankruptcy must be one of NONE, DISCHARGED_OVER_5_YEARS, ACTIVE_OR_RECENT",
        });
      }

      const result = scoreService.calculateCreditBureauScore(input);

      return res.status(200).json({
        success: true,
        message: "Credit bureau score calculated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating credit bureau score:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate credit bureau score",
      });
    }
  }

  async calculateMerchantRiskScore(req: Request, res: Response) {
    try {
      const input: MerchantRiskInput = req.body;

      if (!input || typeof input !== "object") {
        return res.status(400).json({
          success: false,
          message: "Request body is required",
        });
      }

      if (typeof input.merchantCategory !== "string" || !input.merchantCategory.trim()) {
        return res.status(400).json({
          success: false,
          message: "merchantCategory is required and must be a non-empty string",
        });
      }

      if (typeof input.merchantCategoryScore !== "number") {
        return res.status(400).json({
          success: false,
          message: "merchantCategoryScore is required and must be a number",
        });
      }

      if (typeof input.purchaseUtilizationPercentage !== "number") {
        return res.status(400).json({
          success: false,
          message: "purchaseUtilizationPercentage is required and must be a number",
        });
      }

      const result = scoreService.calculateMerchantRiskScore(input);

      return res.status(200).json({
        success: true,
        message: "Merchant risk score calculated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating merchant risk score:", error);
      const message = error.message || "Failed to calculate merchant risk score";
      const status =
        typeof message === "string" &&
        (message.includes("must be") ||
          message.includes("required") ||
          message.includes("cannot be"))
          ? 400
          : 500;
      return res.status(status).json({
        success: false,
        message,
      });
    }
  }

  async calculateBehaviouralRepaymentScore(req: Request, res: Response) {
    try {
      const { isExistingCustomer, onTimePaymentRatio, achSuccessRate } = req.body ?? {};

      if (typeof isExistingCustomer !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isExistingCustomer is required and must be a boolean",
        });
      }

      if (typeof onTimePaymentRatio !== "number") {
        return res.status(400).json({
          success: false,
          message: "onTimePaymentRatio is required and must be a number",
        });
      }

      if (typeof achSuccessRate !== "number") {
        return res.status(400).json({
          success: false,
          message: "achSuccessRate is required and must be a number",
        });
      }

      const result = scoreService.calculateBehaviouralRepaymentScore(
        isExistingCustomer,
        onTimePaymentRatio,
        achSuccessRate
      );

      return res.status(200).json({
        success: true,
        message: "Behavioural repayment score calculated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating behavioural repayment score:", error);
      const message = error.message || "Failed to calculate behavioural repayment score";
      const status =
        typeof message === "string" &&
        (message.includes("must be") ||
          message.includes("required") ||
          message.includes("cannot be"))
          ? 400
          : 500;
      return res.status(status).json({
        success: false,
        message,
      });
    }
  }

  async calculateSpendingPower(req: Request, res: Response) {
    try {
      const {
        disposableIncome,
        riskScore,
        behaviourScore,
        useDatabase = false,
        config,
      } = req.body ?? {};

      if (typeof disposableIncome !== "number") {
        return res.status(400).json({
          success: false,
          message: "disposableIncome is required and must be a number",
        });
      }

      if (typeof riskScore !== "number") {
        return res.status(400).json({
          success: false,
          message: "riskScore is required and must be a number",
        });
      }

      if (typeof behaviourScore !== "number") {
        return res.status(400).json({
          success: false,
          message: "behaviourScore is required and must be a number",
        });
      }

      const input: SpendingPowerInput = {
        disposableIncome,
        riskScore,
        behaviourScore,
      };

      const spendingConfig: SpendingPowerConfig | undefined =
        config && typeof config === "object" ? config : undefined;

      const result = await scoreService.calculateSpendingPower(
        input,
        Boolean(useDatabase),
        spendingConfig
      );

      return res.status(200).json({
        success: true,
        message: "Spending power calculated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating spending power:", error);
      const message = error.message || "Failed to calculate spending power";
      const status =
        typeof message === "string" &&
        (message.includes("must be") ||
          message.includes("required") ||
          message.includes("cannot be") ||
          message.includes("No risk") ||
          message.includes("No behavioural"))
          ? 400
          : 500;
      return res.status(status).json({
        success: false,
        message,
      });
    }
  }

  async calculateRepaymentPlan(req: Request, res: Response) {
    try {
      const { loanAmount, monthlySpendingPower, numberOfInstallments, firstInstallment } =
        req.body ?? {};

      if (typeof loanAmount !== "number") {
        return res.status(400).json({
          success: false,
          message: "loanAmount is required and must be a number",
        });
      }

      if (typeof monthlySpendingPower !== "number") {
        return res.status(400).json({
          success: false,
          message: "monthlySpendingPower is required and must be a number",
        });
      }

      if (numberOfInstallments !== 4 && numberOfInstallments !== 6) {
        return res.status(400).json({
          success: false,
          message: "numberOfInstallments must be either 4 or 6",
        });
      }

      if (firstInstallment !== undefined && typeof firstInstallment !== "number") {
        return res.status(400).json({
          success: false,
          message: "firstInstallment must be a number when provided",
        });
      }

      const options: RepaymentOptions = {
        loanAmount,
        monthlySpendingPower,
        numberOfInstallments: numberOfInstallments as RepaymentInstallmentCount,
        ...(firstInstallment !== undefined && { firstInstallment }),
      };

      const plan = scoreService.calculateRepaymentPlan(options);

      return res.status(200).json({
        success: true,
        message: "Repayment plan calculated successfully",
        data: {
          options,
          plan,
        },
      });
    } catch (error: any) {
      console.error("Error calculating repayment plan:", error);
      const message = error.message || "Failed to calculate repayment plan";
      const status =
        typeof message === "string" &&
        (message.includes("must be") ||
          message.includes("must") ||
          message.includes("not allowed") ||
          message.includes("greater than") ||
          message.includes("less than"))
          ? 400
          : 500;
      return res.status(status).json({
        success: false,
        message,
      });
    }
  }

  async calculateMonthlyRepayment(req: Request, res: Response) {
    try {
      const { principal, rate, months } = req.body ?? {};

      if (typeof principal !== "number") {
        return res.status(400).json({
          success: false,
          message: "principal is required and must be a number",
        });
      }

      if (typeof rate !== "number") {
        return res.status(400).json({
          success: false,
          message: "rate is required and must be a number",
        });
      }

      if (typeof months !== "number" || !Number.isInteger(months)) {
        return res.status(400).json({
          success: false,
          message: "months is required and must be an integer",
        });
      }

      if (principal <= 0) {
        return res.status(400).json({
          success: false,
          message: "principal must be greater than zero",
        });
      }

      if (months <= 0) {
        return res.status(400).json({
          success: false,
          message: "months must be greater than zero",
        });
      }

      if (rate < 0) {
        return res.status(400).json({
          success: false,
          message: "rate cannot be negative",
        });
      }

      const monthlyRepayment = scoreService.monthlyRepayment(principal, rate, months);

      return res.status(200).json({
        success: true,
        message: "Monthly repayment calculated successfully",
        data: {
          principal,
          rate,
          months,
          monthlyRepayment,
        },
      });
    } catch (error: any) {
      console.error("Error calculating monthly repayment:", error);
      const message = error.message || "Failed to calculate monthly repayment";
      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async calculatePrincipalFromMonthlyRepayment(req: Request, res: Response) {
    try {
      const { monthlyRepayment, rate, months } = req.body ?? {};

      if (typeof monthlyRepayment !== "number") {
        return res.status(400).json({
          success: false,
          message: "monthlyRepayment is required and must be a number",
        });
      }

      if (typeof rate !== "number") {
        return res.status(400).json({
          success: false,
          message: "rate is required and must be a number",
        });
      }

      if (typeof months !== "number" || !Number.isInteger(months)) {
        return res.status(400).json({
          success: false,
          message: "months is required and must be an integer",
        });
      }

      if (monthlyRepayment <= 0) {
        return res.status(400).json({
          success: false,
          message: "monthlyRepayment must be greater than zero",
        });
      }

      if (months <= 0) {
        return res.status(400).json({
          success: false,
          message: "months must be greater than zero",
        });
      }

      if (rate < 0) {
        return res.status(400).json({
          success: false,
          message: "rate cannot be negative",
        });
      }

      const principal = scoreService.principalFromMonthlyRepayment(monthlyRepayment, rate, months);

      return res.status(200).json({
        success: true,
        message: "Principal calculated successfully",
        data: {
          monthlyRepayment,
          rate,
          months,
          principal,
        },
      });
    } catch (error: any) {
      console.error("Error calculating principal from monthly repayment:", error);
      const message = error.message || "Failed to calculate principal";
      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async calculateFinalCustomerScore(req: Request, res: Response) {
    try {
      const body = req.body as FinalCustomerScoreInput;

      if (!body || typeof body !== "object") {
        return res.status(400).json({
          success: false,
          message: "Request body is required",
        });
      }

      const validTypes: CustomerLenderType[] = ["FIRST_TIME_LENDER", "RETURNING_CUSTOMER"];
      if (!validTypes.includes(body.customerType)) {
        return res.status(400).json({
          success: false,
          message: "customerType must be FIRST_TIME_LENDER or RETURNING_CUSTOMER",
        });
      }

      if (!body.openBanking || typeof body.openBanking !== "object") {
        return res.status(400).json({
          success: false,
          message: "openBanking is required",
        });
      }

      if (!body.creditBureau || typeof body.creditBureau !== "object") {
        return res.status(400).json({
          success: false,
          message: "creditBureau is required",
        });
      }

      if (!body.merchantRisk || typeof body.merchantRisk !== "object") {
        return res.status(400).json({
          success: false,
          message: "merchantRisk is required",
        });
      }

      if (body.customerType === "RETURNING_CUSTOMER") {
        if (typeof body.onTimePaymentRatio !== "number") {
          return res.status(400).json({
            success: false,
            message: "onTimePaymentRatio is required for RETURNING_CUSTOMER",
          });
        }
        if (typeof body.achSuccessRate !== "number") {
          return res.status(400).json({
            success: false,
            message: "achSuccessRate is required for RETURNING_CUSTOMER",
          });
        }
      }

      const result = scoreService.calculateFinalCustomerScore(body);

      return res.status(200).json({
        success: true,
        message: "Final customer score calculated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating final customer score:", error);
      const message = error.message || "Failed to calculate final customer score";
      const status =
        typeof message === "string" &&
        (message.includes("must be") ||
          message.includes("required") ||
          message.includes("cannot be"))
          ? 400
          : 500;
      return res.status(status).json({
        success: false,
        message,
      });
    }
  }

  async determineEligibility(req: Request, res: Response) {
    try {
      const { totalScore, existingLoanRepayment, estimatedMonthlyIncome } = req.body ?? {};

      if (typeof totalScore !== "number") {
        return res.status(400).json({
          success: false,
          message: "totalScore is required and must be a number",
        });
      }

      if (typeof existingLoanRepayment !== "number") {
        return res.status(400).json({
          success: false,
          message: "existingLoanRepayment is required and must be a number",
        });
      }

      if (typeof estimatedMonthlyIncome !== "number") {
        return res.status(400).json({
          success: false,
          message: "estimatedMonthlyIncome is required and must be a number",
        });
      }

      const result = scoreService.determineEligibility(
        totalScore,
        existingLoanRepayment,
        estimatedMonthlyIncome
      );

      return res.status(200).json({
        success: true,
        message: "Eligibility determined successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error determining eligibility:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to determine eligibility",
      });
    }
  }

  async calculate(req: Request, res: Response) {
    try {
      const input: ScoringInput = req.body;

      if (!input || typeof input !== "object") {
        return res.status(400).json({
          success: false,
          message: "Request body is required",
        });
      }

      if (!input.incomeRecurrent || !input.incomeStability || !input.liquidityBuffer) {
        return res.status(400).json({
          success: false,
          message: "incomeRecurrent, incomeStability, and liquidityBuffer are required",
        });
      }

      if (typeof input.netCashFlowPositiveCount !== "number") {
        return res.status(400).json({
          success: false,
          message: "netCashFlowPositiveCount is required and must be a number",
        });
      }

      if (typeof input.creditHistory !== "number") {
        return res.status(400).json({
          success: false,
          message: "creditHistory is required and must be a number",
        });
      }

      if (typeof input.existingLoanRepayment !== "number") {
        return res.status(400).json({
          success: false,
          message: "existingLoanRepayment is required and must be a number",
        });
      }

      if (input.overdraftRecent !== undefined && typeof input.overdraftRecent !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "overdraftRecent must be a boolean when provided",
        });
      }

      if (!input.riskFactor || typeof input.riskFactor !== "object") {
        return res.status(400).json({
          success: false,
          message: "riskFactor is required and must be an object (MonthlyScores)",
        });
      }

      const result = await scoreService.scoring(input);

      return res.status(200).json({
        success: true,
        message: "Scoring calculated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating scoring:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate scoring",
      });
    }
  }

  async selfAssessmentCalculate(req: Request, res: Response) {
    try {
      const input: SelfAssessmentScoringInput = req.body;

      if (!input || typeof input !== "object") {
        return res.status(400).json({
          success: false,
          message: "Request body is required",
        });
      }

      if (!input.incomeRecurrent) {
        return res.status(400).json({
          success: false,
          message: "incomeRecurrent is required",
        });
      }

      if (typeof input.overdraftCount !== "number") {
        return res.status(400).json({
          success: false,
          message: "overdraftCount is required and must be a number",
        });
      }

      if (typeof input.overdraftEvents !== "number") {
        return res.status(400).json({
          success: false,
          message: "overdraftEvents is required and must be a number",
        });
      }

      if (typeof input.overdraftDeepestNegativeBalance !== "number") {
        return res.status(400).json({
          success: false,
          message: "overdraftDeepestNegativeBalance is required and must be a number",
        });
      }

      if (typeof input.overdraftNegativeDays !== "number") {
        return res.status(400).json({
          success: false,
          message: "overdraftNegativeDays is required and must be a number",
        });
      }

      if (typeof input.overdraftRecent !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "overdraftRecent is required and must be a boolean",
        });
      }

      if (typeof input.creditHistory !== "number") {
        return res.status(400).json({
          success: false,
          message: "creditHistory is required and must be a number",
        });
      }

      if (typeof input.totalFlags !== "number") {
        return res.status(400).json({
          success: false,
          message: "totalFlags is required and must be a number",
        });
      }

      if (typeof input.estimatedMonthlyIncome !== "number") {
        return res.status(400).json({
          success: false,
          message: "estimatedMonthlyIncome is required and must be a number",
        });
      }

      if (typeof input.existingLoanRepayment !== "number") {
        return res.status(400).json({
          success: false,
          message: "existingLoanRepayment is required and must be a number",
        });
      }

      const result = await scoreService.selfAssessmentScoring(input);

      return res.status(200).json({
        success: true,
        message: "Self-assessment scoring calculated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating self-assessment scoring:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate self-assessment scoring",
      });
    }
  }

  async evaluateFinancing(req: Request, res: Response) {
    try {
      const {
        productAmount,
        customerMaxRepayment,
        maxPrincipal,
        rate,
        months,
        intendedUpfrontPayment,
      } = req.body ?? {};

      const requiredNumbers: Array<[string, any]> = [
        ["productAmount", productAmount],
        ["customerMaxRepayment", customerMaxRepayment],
        ["maxPrincipal", maxPrincipal],
        ["rate", rate],
        ["months", months],
      ];

      for (const [field, value] of requiredNumbers) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} is required and must be a number`,
          });
        }
      }

      if (!Number.isInteger(months) || months <= 0) {
        return res.status(400).json({
          success: false,
          message: "months must be an integer greater than zero",
        });
      }

      if (productAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "productAmount must be greater than zero",
        });
      }

      if (customerMaxRepayment <= 0) {
        return res.status(400).json({
          success: false,
          message: "customerMaxRepayment must be greater than zero",
        });
      }

      if (maxPrincipal < 0) {
        return res.status(400).json({
          success: false,
          message: "maxPrincipal cannot be negative",
        });
      }

      if (rate < 0) {
        return res.status(400).json({
          success: false,
          message: "rate cannot be negative",
        });
      }

      if (
        intendedUpfrontPayment !== undefined &&
        (typeof intendedUpfrontPayment !== "number" || !Number.isFinite(intendedUpfrontPayment))
      ) {
        return res.status(400).json({
          success: false,
          message: "intendedUpfrontPayment must be a number when provided",
        });
      }

      const result = scoreService.evaluateFinancing({
        productAmount,
        customerMaxRepayment,
        maxPrincipal,
        rate,
        months,
        intendedUpfrontPayment,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error("Error evaluating financing:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to evaluate financing",
      });
    }
  }

  async calculateFinance(req: Request, res: Response) {
    try {
      const { purchaseAmount, partPayment, rate, tenor, minSp, maxSp } = req.body ?? {};

      if (typeof purchaseAmount !== "number" || !Number.isFinite(purchaseAmount)) {
        return res.status(400).json({
          success: false,
          message: "purchaseAmount is required and must be a number",
        });
      }

      if (tenor !== 4 && tenor !== 6) {
        return res.status(400).json({
          success: false,
          message: "tenor is required and must be either 4 or 6",
        });
      }

      if (
        partPayment !== undefined &&
        (typeof partPayment !== "number" || !Number.isFinite(partPayment))
      ) {
        return res.status(400).json({
          success: false,
          message: "partPayment must be a number when provided",
        });
      }

      // rate, minSp and maxSp are optional; the service resolves them from the
      // product configuration for this tenor when they are omitted
      const optionalNumbers: Array<[string, any]> = [
        ["rate", rate],
        ["minSp", minSp],
        ["maxSp", maxSp],
      ];

      for (const [field, value] of optionalNumbers) {
        if (value === undefined) continue;

        if (typeof value !== "number" || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a number when provided`,
          });
        }

        if (value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative`,
          });
        }
      }

      if (minSp !== undefined && maxSp !== undefined && minSp > maxSp) {
        return res.status(400).json({
          success: false,
          message: "minSp cannot be greater than maxSp",
        });
      }

      const result = await scoreService.calculateFinance({
        purchaseAmount,
        tenor: tenor as Tenor,
        ...(rate !== undefined && { rate }),
        ...(minSp !== undefined && { minSp }),
        ...(maxSp !== undefined && { maxSp }),
        ...(partPayment !== undefined && { partPayment }),
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating finance:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate finance",
      });
    }
  }

  async calculateFinanceForMonthlyFlex(req: Request, res: Response) {
    try {
      const { purchaseAmount, partPayment, rate, tenor, minSp, maxSp } = req.body ?? {};

      if (typeof purchaseAmount !== "number" || !Number.isFinite(purchaseAmount)) {
        return res.status(400).json({
          success: false,
          message: "purchaseAmount is required and must be a number",
        });
      }

      if (typeof tenor !== "number" || !Number.isInteger(tenor) || tenor < 3 || tenor > 12) {
        return res.status(400).json({
          success: false,
          message: "tenor is required and must be an integer between 3 and 12",
        });
      }

      if (
        partPayment !== undefined &&
        (typeof partPayment !== "number" || !Number.isFinite(partPayment))
      ) {
        return res.status(400).json({
          success: false,
          message: "partPayment must be a number when provided",
        });
      }

      // rate, minSp and maxSp are optional; the service resolves them from the
      // product configuration for this tenor when they are omitted
      const optionalNumbers: Array<[string, any]> = [
        ["rate", rate],
        ["minSp", minSp],
        ["maxSp", maxSp],
      ];

      for (const [field, value] of optionalNumbers) {
        if (value === undefined) continue;

        if (typeof value !== "number" || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a number when provided`,
          });
        }

        if (value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative`,
          });
        }
      }

      if (minSp !== undefined && maxSp !== undefined && minSp > maxSp) {
        return res.status(400).json({
          success: false,
          message: "minSp cannot be greater than maxSp",
        });
      }

      const result = await scoreService.calculateFinanceForMonthlyFlex({
        purchaseAmount,
        tenor: tenor as MonthlyFlexTenor,
        ...(rate !== undefined && { rate }),
        ...(minSp !== undefined && { minSp }),
        ...(maxSp !== undefined && { maxSp }),
        ...(partPayment !== undefined && { partPayment }),
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating monthly flex finance:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate monthly flex finance",
      });
    }
  }

  async calculateFinanceByProduct(req: Request, res: Response) {
    try {
      const { productType, purchaseAmount, partPayment, rate, tenor, minSp, maxSp } =
        req.body ?? {};

      const normalisedProductType =
        typeof productType === "string"
          ? productType.trim().toUpperCase().replace(/-/g, "_")
          : undefined;

      if (
        normalisedProductType !== "BI_WEEKLY" &&
        normalisedProductType !== "MONTHLY_FLEX"
      ) {
        return res.status(400).json({
          success: false,
          message: "productType is required and must be either BI_WEEKLY or MONTHLY_FLEX",
        });
      }

      if (typeof purchaseAmount !== "number" || !Number.isFinite(purchaseAmount)) {
        return res.status(400).json({
          success: false,
          message: "purchaseAmount is required and must be a number",
        });
      }

      if (typeof tenor !== "number" || !Number.isInteger(tenor)) {
        return res.status(400).json({
          success: false,
          message: "tenor is required and must be an integer",
        });
      }

      if (normalisedProductType === "BI_WEEKLY" && tenor !== 4 && tenor !== 6) {
        return res.status(400).json({
          success: false,
          message: "tenor must be either 4 or 6 for BI_WEEKLY",
        });
      }

      if (normalisedProductType === "MONTHLY_FLEX" && (tenor < 3 || tenor > 12)) {
        return res.status(400).json({
          success: false,
          message: "tenor must be between 3 and 12 for MONTHLY_FLEX",
        });
      }

      if (
        partPayment !== undefined &&
        (typeof partPayment !== "number" || !Number.isFinite(partPayment))
      ) {
        return res.status(400).json({
          success: false,
          message: "partPayment must be a number when provided",
        });
      }

      // rate, minSp and maxSp are optional; the service resolves them from the
      // product configuration for the resolved code when they are omitted
      const optionalNumbers: Array<[string, any]> = [
        ["rate", rate],
        ["minSp", minSp],
        ["maxSp", maxSp],
      ];

      for (const [field, value] of optionalNumbers) {
        if (value === undefined) continue;

        if (typeof value !== "number" || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a number when provided`,
          });
        }

        if (value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative`,
          });
        }
      }

      if (minSp !== undefined && maxSp !== undefined && minSp > maxSp) {
        return res.status(400).json({
          success: false,
          message: "minSp cannot be greater than maxSp",
        });
      }

      const result = await scoreService.calculateFinanceByProduct({
        productType: normalisedProductType as FinancingProductType,
        purchaseAmount,
        tenor: tenor as Tenor | MonthlyFlexTenor,
        ...(rate !== undefined && { rate }),
        ...(minSp !== undefined && { minSp }),
        ...(maxSp !== undefined && { maxSp }),
        ...(partPayment !== undefined && { partPayment }),
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating finance by product:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate finance",
      });
    }
  }

  async calculateAvailableSpendingPower(req: Request, res: Response) {
    try {
      const {
        tenure,
        disposableIncome,
        affordabilityAllocationRate,
        riskMultiplier,
        behaviourMultiplier,
        totalPlatformExposure,
        productRate,
        productMini,
        productMax,
      } = req.body ?? {};

      if (tenure !== 4 && tenure !== 6) {
        return res.status(400).json({
          success: false,
          message: "tenure is required and must be either 4 or 6",
        });
      }

      const requiredNumbers: Array<[string, any]> = [
        ["disposableIncome", disposableIncome],
        ["affordabilityAllocationRate", affordabilityAllocationRate],
        ["riskMultiplier", riskMultiplier],
        ["behaviourMultiplier", behaviourMultiplier],
        ["totalPlatformExposure", totalPlatformExposure],
      ];

      for (const [field, value] of requiredNumbers) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} is required and must be a number`,
          });
        }

        if (value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative`,
          });
        }
      }

      // productMini and productMax are optional; the service resolves them from the
      // product configuration for this tenure when they are omitted
      const optionalNumbers: Array<[string, any]> = [
        ["productRate", productRate],
        ["productMini", productMini],
        ["productMax", productMax],
      ];

      for (const [field, value] of optionalNumbers) {
        if (value === undefined) continue;

        if (typeof value !== "number" || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a number when provided`,
          });
        }

        if (value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative`,
          });
        }
      }

      if (productMini !== undefined && productMax !== undefined && productMini > productMax) {
        return res.status(400).json({
          success: false,
          message: "productMini cannot be greater than productMax",
        });
      }

      const result = await scoreService.calculateAvailableSpendingPower({
        tenure: tenure as Tenor,
        disposableIncome,
        affordabilityAllocationRate,
        riskMultiplier,
        behaviourMultiplier,
        totalPlatformExposure,
        ...(productRate !== undefined && { productRate }),
        ...(productMini !== undefined && { productMini }),
        ...(productMax !== undefined && { productMax }),
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating available spending power:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate available spending power",
      });
    }
  }

  async calculateAvailableSpendingPowerMonthlyFlex(req: Request, res: Response) {
    try {
      const {
        tenure,
        disposableIncome,
        affordabilityAllocationRate,
        riskMultiplier,
        behaviourMultiplier,
        totalPlatformExposure,
        productRate,
        productMini,
        productMax,
      } = req.body ?? {};

      if (typeof tenure !== "number" || !Number.isInteger(tenure) || tenure < 3 || tenure > 12) {
        return res.status(400).json({
          success: false,
          message: "tenure is required and must be an integer between 3 and 12",
        });
      }

      const requiredNumbers: Array<[string, any]> = [
        ["disposableIncome", disposableIncome],
        ["affordabilityAllocationRate", affordabilityAllocationRate],
        ["riskMultiplier", riskMultiplier],
        ["behaviourMultiplier", behaviourMultiplier],
        ["totalPlatformExposure", totalPlatformExposure],
      ];

      for (const [field, value] of requiredNumbers) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} is required and must be a number`,
          });
        }

        if (value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative`,
          });
        }
      }

      // productRate, productMini and productMax are optional; the service resolves them
      // from the product configuration for this tenure when they are omitted
      const optionalNumbers: Array<[string, any]> = [
        ["productRate", productRate],
        ["productMini", productMini],
        ["productMax", productMax],
      ];

      for (const [field, value] of optionalNumbers) {
        if (value === undefined) continue;

        if (typeof value !== "number" || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a number when provided`,
          });
        }

        if (value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative`,
          });
        }
      }

      if (productMini !== undefined && productMax !== undefined && productMini > productMax) {
        return res.status(400).json({
          success: false,
          message: "productMini cannot be greater than productMax",
        });
      }

      const result = await scoreService.calculateAvailableSpendingPowerMonthlyFlex({
        tenure: tenure as MonthlyFlexTenor,
        disposableIncome,
        affordabilityAllocationRate,
        riskMultiplier,
        behaviourMultiplier,
        totalPlatformExposure,
        ...(productRate !== undefined && { productRate }),
        ...(productMini !== undefined && { productMini }),
        ...(productMax !== undefined && { productMax }),
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating monthly flex available spending power:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate monthly flex available spending power",
      });
    }
  }

  async calculateAvailableSpendingPowerByProduct(req: Request, res: Response) {
    try {
      const {
        productType,
        tenure,
        disposableIncome,
        affordabilityAllocationRate,
        riskMultiplier,
        behaviourMultiplier,
        totalPlatformExposure,
        productRate,
        productMini,
        productMax,
      } = req.body ?? {};

      const normalisedProductType =
        typeof productType === "string"
          ? productType.trim().toUpperCase().replace(/-/g, "_")
          : undefined;

      if (normalisedProductType !== "BI_WEEKLY" && normalisedProductType !== "MONTHLY_FLEX") {
        return res.status(400).json({
          success: false,
          message: "productType is required and must be either BI_WEEKLY or MONTHLY_FLEX",
        });
      }

      if (typeof tenure !== "number" || !Number.isInteger(tenure)) {
        return res.status(400).json({
          success: false,
          message: "tenure is required and must be an integer",
        });
      }

      if (normalisedProductType === "BI_WEEKLY" && tenure !== 4 && tenure !== 6) {
        return res.status(400).json({
          success: false,
          message: "tenure must be either 4 or 6 for BI_WEEKLY",
        });
      }

      if (normalisedProductType === "MONTHLY_FLEX" && (tenure < 3 || tenure > 12)) {
        return res.status(400).json({
          success: false,
          message: "tenure must be between 3 and 12 for MONTHLY_FLEX",
        });
      }

      const requiredNumbers: Array<[string, any]> = [
        ["disposableIncome", disposableIncome],
        ["affordabilityAllocationRate", affordabilityAllocationRate],
        ["riskMultiplier", riskMultiplier],
        ["behaviourMultiplier", behaviourMultiplier],
        ["totalPlatformExposure", totalPlatformExposure],
      ];

      for (const [field, value] of requiredNumbers) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} is required and must be a number`,
          });
        }

        if (value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative`,
          });
        }
      }

      // Product configuration values are optional; the service resolves whatever is
      // omitted from the product configuration for the resolved code
      const optionalNumbers: Array<[string, any]> = [
        ["productRate", productRate],
        ["productMini", productMini],
        ["productMax", productMax],
      ];

      for (const [field, value] of optionalNumbers) {
        if (value === undefined) continue;

        if (typeof value !== "number" || !Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a number when provided`,
          });
        }

        if (value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative`,
          });
        }
      }

      if (productMini !== undefined && productMax !== undefined && productMini > productMax) {
        return res.status(400).json({
          success: false,
          message: "productMini cannot be greater than productMax",
        });
      }

      const result = await scoreService.calculateAvailableSpendingPowerByProduct({
        productType: normalisedProductType as FinancingProductType,
        tenure: tenure as Tenor | MonthlyFlexTenor,
        disposableIncome,
        affordabilityAllocationRate,
        riskMultiplier,
        behaviourMultiplier,
        totalPlatformExposure,
        ...(productRate !== undefined && { productRate }),
        ...(productMini !== undefined && { productMini }),
        ...(productMax !== undefined && { productMax }),
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error("Error calculating available spending power by product:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate available spending power",
      });
    }
  }
}

export const scoringController = new ScoringController();
