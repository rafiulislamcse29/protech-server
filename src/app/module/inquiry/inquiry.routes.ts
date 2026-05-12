import { Router } from "express";
import { authenticate, authorize } from "../../middleware/index.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { createInquirySchema, updateInquiryStatusSchema } from "./inquiry.validation.js";
import * as inquiryController from "./inquiry.controller.js";

const router = Router();

router.use(authenticate);

// Buyer Routes
router.post("/", validateRequest(createInquirySchema), inquiryController.createInquiry);
router.get("/my-inquiries", inquiryController.getMyInquiries);

// Agent Routes
router.get("/agent-list", authorize("AGENT"), inquiryController.getAgentInquiries);
router.patch("/:inquiryId/status", authorize("AGENT"), validateRequest(updateInquiryStatusSchema), inquiryController.updateInquiryStatus);

export default router;
