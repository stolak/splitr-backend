import { Router } from "express";
import {
  createInquiry,
  getInquiry,
  getOrCreateInquiryForBuyer,
  listInquiries,
  updateInquiry,
} from "../controllers/personaInquiryController";

const router = Router();

router.post("/inquiries", createInquiry);
router.get("/inquiries", listInquiries);
router.post("/inquiries/buyer/:buyerId", getOrCreateInquiryForBuyer);
router.patch("/inquiries/:inquiryId/sync", updateInquiry);
router.get("/inquiries/:inquiryId", getInquiry);

export default router;

