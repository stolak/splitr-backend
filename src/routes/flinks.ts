import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import {
  authorize,
  generateAuthorizeToken,
} from "../controllers/flinksController";

const router = Router();

router.post("/authorize-token", authenticateJWT, generateAuthorizeToken);
router.post("/authorize", authenticateJWT, authorize);

export default router;
