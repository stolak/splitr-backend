import { Router } from "express";
import { splitrIdController } from "../controllers/splitrIdController";

const router = Router();

// Health check endpoint
router.get("/health", splitrIdController.health);

// Generate splitr ID
router.post("/generate", splitrIdController.generatesplitrId);

// Validate splitr ID
router.post("/validate", splitrIdController.validatesplitrId);

// Get sequences for a specific prefix
router.get("/sequences/:prefix", splitrIdController.getSequencesForPrefix);

// Get statistics
router.get("/statistics", splitrIdController.getStatistics);

export default router;
