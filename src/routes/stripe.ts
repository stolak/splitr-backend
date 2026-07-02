import { Router } from "express";
import {
  chargeMandate,
  completeMandate,
  createCustomer,
  createPaymentIntent,
  createSetupIntent,
  getMandate,
  getSetupIntent,
  listMandates,
} from "../controllers/stripeController";

const router = Router();

router.post("/customers", createCustomer);
router.post("/create-intent", createPaymentIntent);
router.post("/setup-intent", createSetupIntent);
router.get("/setup-intents/:setupIntentId", getSetupIntent);
router.post("/mandates/complete", completeMandate);
router.get("/mandates", listMandates);
router.get("/mandates/:mandateId", getMandate);
router.post("/mandates/charge", chargeMandate);

export default router;
