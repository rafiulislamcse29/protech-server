import { Router } from "express";
import { authenticate } from "../../middleware/index.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { createReviewSchema } from "./review.validation.js";
import * as reviewController from "./review.controller.js";

const router = Router();

// Public
router.get("/property/:propertyId", reviewController.getPropertyReviews);

// Protected
router.use(authenticate);

router.post("/", validateRequest(createReviewSchema), reviewController.createReview);
router.get("/me", reviewController.getMyReviews);
router.delete("/:reviewId", reviewController.deleteReview);

export default router;
