import { Request, Response } from 'express';
import {
  scoreService,
  ScoringInput,
  SelfAssessmentScoringInput,
  OpenBankingInput,
  CreditBureauInput,
  MerchantRiskInput,
  FinalCustomerScoreInput,
  CustomerLenderType,
} from '../services/scoringService';

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

      if (!input || typeof input !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
        });
      }

      const requiredFields: (keyof OpenBankingInput)[] = [
        'monthlyIncome',
        'incomeStabilityVariance',
        'netCashFlowPercentage',
        'liquidityMonths',
        'nsfEvents',
        'overdraftFrequency',
        'loanBurdenPercentage',
      ];

      for (const field of requiredFields) {
        if (typeof input[field] !== 'number') {
          return res.status(400).json({
            success: false,
            message: `${field} is required and must be a number`,
          });
        }
      }

      const result = scoreService.calculateOpenBankingScore(input);

      return res.status(200).json({
        success: true,
        message: 'Open banking score calculated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error calculating open banking score:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate open banking score',
      });
    }
  }

  async calculateCreditBureauScore(req: Request, res: Response) {
    try {
      const input: CreditBureauInput = req.body;

      if (!input || typeof input !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
        });
      }

      const numberFields: (keyof CreditBureauInput)[] = [
        'creditScore',
        'utilizationPercentage',
        'delinquencies24Months',
        'hardInquiries12Months',
      ];

      for (const field of numberFields) {
        if (typeof input[field] !== 'number') {
          return res.status(400).json({
            success: false,
            message: `${field} is required and must be a number`,
          });
        }
      }

      const validCollections = ['NONE', 'PAID', 'ACTIVE'];
      if (!validCollections.includes(input.collections)) {
        return res.status(400).json({
          success: false,
          message: 'collections must be one of NONE, PAID, ACTIVE',
        });
      }

      const validBankruptcy = ['NONE', 'DISCHARGED_OVER_5_YEARS', 'ACTIVE_OR_RECENT'];
      if (!validBankruptcy.includes(input.bankruptcy)) {
        return res.status(400).json({
          success: false,
          message:
            'bankruptcy must be one of NONE, DISCHARGED_OVER_5_YEARS, ACTIVE_OR_RECENT',
        });
      }

      const result = scoreService.calculateCreditBureauScore(input);

      return res.status(200).json({
        success: true,
        message: 'Credit bureau score calculated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error calculating credit bureau score:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate credit bureau score',
      });
    }
  }

  async calculateMerchantRiskScore(req: Request, res: Response) {
    try {
      const input: MerchantRiskInput = req.body;

      if (!input || typeof input !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
        });
      }

      if (typeof input.merchantCategory !== 'string' || !input.merchantCategory.trim()) {
        return res.status(400).json({
          success: false,
          message: 'merchantCategory is required and must be a non-empty string',
        });
      }

      if (typeof input.merchantCategoryScore !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'merchantCategoryScore is required and must be a number',
        });
      }

      if (typeof input.purchaseUtilizationPercentage !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'purchaseUtilizationPercentage is required and must be a number',
        });
      }

      const result = scoreService.calculateMerchantRiskScore(input);

      return res.status(200).json({
        success: true,
        message: 'Merchant risk score calculated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error calculating merchant risk score:', error);
      const message = error.message || 'Failed to calculate merchant risk score';
      const status =
        typeof message === 'string' &&
        (message.includes('must be') ||
          message.includes('required') ||
          message.includes('cannot be'))
          ? 400
          : 500;
      return res.status(status).json({
        success: false,
        message,
      });
    }
  }

  async calculateFinalCustomerScore(req: Request, res: Response) {
    try {
      const body = req.body as FinalCustomerScoreInput;

      if (!body || typeof body !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
        });
      }

      const validTypes: CustomerLenderType[] = [
        'FIRST_TIME_LENDER',
        'RETURNING_CUSTOMER',
      ];
      if (!validTypes.includes(body.customerType)) {
        return res.status(400).json({
          success: false,
          message:
            'customerType must be FIRST_TIME_LENDER or RETURNING_CUSTOMER',
        });
      }

      if (!body.openBanking || typeof body.openBanking !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'openBanking is required',
        });
      }

      if (!body.creditBureau || typeof body.creditBureau !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'creditBureau is required',
        });
      }

      if (!body.merchantRisk || typeof body.merchantRisk !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'merchantRisk is required',
        });
      }

      const result = scoreService.calculateFinalCustomerScore(body);

      return res.status(200).json({
        success: true,
        message: 'Final customer score calculated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error calculating final customer score:', error);
      const message = error.message || 'Failed to calculate final customer score';
      const status =
        typeof message === 'string' &&
        (message.includes('must be') ||
          message.includes('required') ||
          message.includes('cannot be'))
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

      if (typeof totalScore !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'totalScore is required and must be a number',
        });
      }

      if (typeof existingLoanRepayment !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'existingLoanRepayment is required and must be a number',
        });
      }

      if (typeof estimatedMonthlyIncome !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'estimatedMonthlyIncome is required and must be a number',
        });
      }

      const result = scoreService.determineEligibility(
        totalScore,
        existingLoanRepayment,
        estimatedMonthlyIncome,
      );

      return res.status(200).json({
        success: true,
        message: 'Eligibility determined successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error determining eligibility:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to determine eligibility',
      });
    }
  }

  async calculate(req: Request, res: Response) {
    try {
      const input: ScoringInput = req.body;

      if (!input || typeof input !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
        });
      }

      if (!input.incomeRecurrent || !input.incomeStability || !input.liquidityBuffer) {
        return res.status(400).json({
          success: false,
          message: 'incomeRecurrent, incomeStability, and liquidityBuffer are required',
        });
      }

      if (typeof input.netCashFlowPositiveCount !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'netCashFlowPositiveCount is required and must be a number',
        });
      }

      if (typeof input.creditHistory !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'creditHistory is required and must be a number',
        });
      }

      if (typeof input.existingLoanRepayment !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'existingLoanRepayment is required and must be a number',
        });
      }

      if (input.overdraftRecent !== undefined && typeof input.overdraftRecent !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'overdraftRecent must be a boolean when provided',
        });
      }

      if (!input.riskFactor || typeof input.riskFactor !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'riskFactor is required and must be an object (MonthlyScores)',
        });
      }

      const result = await scoreService.scoring(input);

      return res.status(200).json({
        success: true,
        message: 'Scoring calculated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error calculating scoring:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate scoring',
      });
    }
  }

  async selfAssessmentCalculate(req: Request, res: Response) {
    try {
      const input: SelfAssessmentScoringInput = req.body;

      if (!input || typeof input !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
        });
      }

      if (!input.incomeRecurrent) {
        return res.status(400).json({
          success: false,
          message: 'incomeRecurrent is required',
        });
      }

      if (typeof input.overdraftCount !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'overdraftCount is required and must be a number',
        });
      }

      if (typeof input.overdraftEvents !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'overdraftEvents is required and must be a number',
        });
      }

      if (typeof input.overdraftDeepestNegativeBalance !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'overdraftDeepestNegativeBalance is required and must be a number',
        });
      }

      if (typeof input.overdraftNegativeDays !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'overdraftNegativeDays is required and must be a number',
        });
      }

      if (typeof input.overdraftRecent !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'overdraftRecent is required and must be a boolean',
        });
      }

      if (typeof input.creditHistory !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'creditHistory is required and must be a number',
        });
      }

      if (typeof input.totalFlags !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'totalFlags is required and must be a number',
        });
      }

      if (typeof input.estimatedMonthlyIncome !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'estimatedMonthlyIncome is required and must be a number',
        });
      }

      if (typeof input.existingLoanRepayment !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'existingLoanRepayment is required and must be a number',
        });
      }

      const result = await scoreService.selfAssessmentScoring(input);

      return res.status(200).json({
        success: true,
        message: 'Self-assessment scoring calculated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error calculating self-assessment scoring:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate self-assessment scoring',
      });
    }
  }
}

export const scoringController = new ScoringController();
