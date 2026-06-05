import { Router } from "express";
import { mandateDebitController } from "../controllers/mandateDebitController";

const router = Router();

router.post("/", mandateDebitController.create);
router.get("/", mandateDebitController.list);
router.get(
  "/mandate/:mandateId/reference/:reference",
  mandateDebitController.getByMandateIdAndReference
);
router.get("/:id", mandateDebitController.getById);
router.patch("/:id", mandateDebitController.update);
router.delete("/:id", mandateDebitController.remove);

export default router;

