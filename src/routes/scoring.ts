import { Router } from "express";
import { scoringController } from "../controllers/scoringController";

const router = Router();

router.post("/calculate", scoringController.calculate);
router.post("/self-assessment/calculate", scoringController.selfAssessmentCalculate);
router.post("/open-banking/calculate", scoringController.calculateOpenBankingScore);
router.post("/credit-bureau/calculate", scoringController.calculateCreditBureauScore);
router.post("/merchant-risk/calculate", scoringController.calculateMerchantRiskScore);
router.post("/bri/calculate", scoringController.calculateBehaviouralRepaymentScore);
router.post("/spending-power/calculate", scoringController.calculateSpendingPower);
router.post("/repayment-plan/calculate", scoringController.calculateRepaymentPlan);
router.post("/monthly-repayment/calculate", scoringController.calculateMonthlyRepayment);
router.post("/principal/calculate", scoringController.calculatePrincipalFromMonthlyRepayment);
router.post("/financing/evaluate", scoringController.evaluateFinancing);
router.post("/finance/calculate", scoringController.calculateFinance);
router.post("/finance/monthly-flex/calculate", scoringController.calculateFinanceForMonthlyFlex);
router.post(
  "/available-spending-power/calculate",
  scoringController.calculateAvailableSpendingPower
);
router.post(
  "/available-spending-power/monthly-flex/calculate",
  scoringController.calculateAvailableSpendingPowerMonthlyFlex
);
router.post("/final/calculate", scoringController.calculateFinalCustomerScore);
router.post("/eligibility/determine", scoringController.determineEligibility);

export default router;
