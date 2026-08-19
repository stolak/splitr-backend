import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import {
  authorize,
  generateAuthorizeToken,
  getAccountsDetail,
  getAccountsSummary,
  getIncomeAttributes,
} from "../controllers/flinksController";

const router = Router();

router.post("/authorize-token", authenticateJWT, generateAuthorizeToken);
router.post("/authorize", authenticateJWT, authorize);
router.post("/accounts-summary", authenticateJWT, getAccountsSummary);
router.post("/accounts-detail", authenticateJWT, getAccountsDetail);
router.get("/income-attributes/:loginId/:attributeId", authenticateJWT, getIncomeAttributes);

export default router;
