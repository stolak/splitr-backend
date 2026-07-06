import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import {
  createLinkToken,
  exchangePublicToken,
  getBankIncome,
} from "../controllers/plaidController";

const router = Router();

router.post("/link-token", authenticateJWT, createLinkToken);
router.post("/exchange-public-token", authenticateJWT, exchangePublicToken);
router.post("/bank-income", authenticateJWT, getBankIncome);

export default router;
