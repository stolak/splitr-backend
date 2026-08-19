import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { generateAuthorizeToken } from "../controllers/flinksController";

const router = Router();

router.post("/authorize-token", authenticateJWT, generateAuthorizeToken);

export default router;
