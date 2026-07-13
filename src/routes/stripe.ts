import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import {
  chargeMandate,
  completeMandate,
  createConnectAccount,
  createConnectAccountLink,
  createCustomer,
  createMerchantConnectOnboarding,
  createPayout,
  getBalance,
  getConnectAccount,
  listConnectAccounts,
  syncMerchantConnectAccount,
  getCustomer,
  createInvoiceSetupIntent,
  createPaymentIntent,
  confirmPaymentIntent,
  listPaymentIntents,
  createSetupIntent,
  getMandate,
  getSetupIntent,
  listMandates,
} from "../controllers/stripeController";

const router = Router();

router.post("/customers", createCustomer);
router.get("/customers/:customerId", getCustomer);
router.post("/create-intent", createPaymentIntent);
router.post("/confirm-intent", confirmPaymentIntent);
router.get("/payment-intents", listPaymentIntents);
router.post("/setup-intent", createSetupIntent);
router.post("/invoices/setup-intent", authenticateJWT, createInvoiceSetupIntent);
router.get("/setup-intents/:setupIntentId", getSetupIntent);
router.post("/mandates/complete", completeMandate);
router.get("/mandates", listMandates);
router.get("/mandates/:mandateId", getMandate);
router.post("/mandates/charge", chargeMandate);
router.get("/balance", authenticateJWT, getBalance);
router.post("/connect/accounts", authenticateJWT, createConnectAccount);
router.get("/connect/accounts", authenticateJWT, listConnectAccounts);
router.get("/connect/accounts/:accountId", authenticateJWT, getConnectAccount);
router.post("/connect/sync-merchant", authenticateJWT, syncMerchantConnectAccount);
router.post("/connect/account-links", authenticateJWT, createConnectAccountLink);
router.post("/connect/onboarding", authenticateJWT, createMerchantConnectOnboarding);
router.post("/connect/payouts", authenticateJWT, createPayout);

export default router;
