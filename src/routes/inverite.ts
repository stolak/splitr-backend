import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { createRequest, createBuyerRequest, fetchRequest } from "../controllers/inveriteController";

const router = Router();

router.post("/create", authenticateJWT, createRequest);
router.post("/buyer/create", authenticateJWT, createBuyerRequest);
router.get("/fetch/:guid", authenticateJWT, fetchRequest);

export default router;
