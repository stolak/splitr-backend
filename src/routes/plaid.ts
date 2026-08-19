import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import {
  createIdentityVerification,
  createIdentityVerificationLinkToken,
  createLinkToken,
  exchangePublicToken,
  getBankIncome,
  getCraIncomeInsights,
  getIdentityVerification,
  listIdentityVerifications,
  retryIdentityVerification,
  syncIdentityVerification,
} from "../controllers/plaidController";

const router = Router();

router.post("/link-token", authenticateJWT, createLinkToken);
router.post("/exchange-public-token", authenticateJWT, exchangePublicToken);
router.post("/bank-income", authenticateJWT, getBankIncome);
router.get("/cra/income-insights", authenticateJWT, getCraIncomeInsights);

router.post(
  "/identity-verification/link-token",
  authenticateJWT,
  createIdentityVerificationLinkToken
);
router.post(
  "/identity-verification/sync",
  authenticateJWT,
  syncIdentityVerification
);
router.post(
  "/identity-verification/retry",
  authenticateJWT,
  retryIdentityVerification
);
router.post("/identity-verification", authenticateJWT, createIdentityVerification);
router.get("/identity-verification", authenticateJWT, listIdentityVerifications);
router.get("/identity-verification/:id", authenticateJWT, getIdentityVerification);

export default router;
