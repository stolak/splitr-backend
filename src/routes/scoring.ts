import { Router } from "express";
import { scoringController } from "../controllers/scoringController";

const router = Router();

router.post("/calculate", scoringController.calculate);
router.post("/self-assessment/calculate", scoringController.selfAssessmentCalculate);
router.post("/open-banking/calculate", scoringController.calculateOpenBankingScore);
router.post("/credit-bureau/calculate", scoringController.calculateCreditBureauScore);
router.post("/merchant-risk/calculate", scoringController.calculateMerchantRiskScore);
router.post("/bri/calculate", scoringController.calculateBehaviouralRepaymentScore);
router.post("/final/calculate", scoringController.calculateFinalCustomerScore);
router.post("/eligibility/determine", scoringController.determineEligibility);

export default router;
