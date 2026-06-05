import { Router } from "express";
import { scoringInputSnapshotEvaluationController } from "../controllers/scoringInputSnapshotEvaluationController";

const router = Router();

router.post("/", scoringInputSnapshotEvaluationController.evaluate);

export default router;

