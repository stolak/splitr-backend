import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import {
  chargeMandate,
  completeMandate,
  createCustomer,
  getCustomer,
  createInvoiceSetupIntent,
  createPaymentIntent,
  createSetupIntent,
  getMandate,
  getSetupIntent,
  listMandates,
} from "../controllers/stripeController";

const router = Router();

router.post("/customers", createCustomer);
router.get("/customers/:customerId", getCustomer);
router.post("/create-intent", createPaymentIntent);
router.post("/setup-intent", createSetupIntent);
router.post("/invoices/setup-intent", authenticateJWT, createInvoiceSetupIntent);
router.get("/setup-intents/:setupIntentId", getSetupIntent);
router.post("/mandates/complete", completeMandate);
router.get("/mandates", listMandates);
router.get("/mandates/:mandateId", getMandate);
router.post("/mandates/charge", chargeMandate);

export default router;
