import { Router } from "express";
import { authenticate } from "../../middleware/index.js";
import {
  naturalLanguageSearchSchema,
  generateDescriptionSchema,
  neighborhoodAnalyzerSchema,
  mortgageAdvisorSchema,
} from "./ai.validation.js";
import * as aiController from "./ai.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";

const router = Router();

/**
 * POST /api/ai/search
 * Feature 1: Natural Language Property Search
 * Public — no auth required so buyers can search without logging in
 */
router.post(
  "/search",
  validateRequest(naturalLanguageSearchSchema),
  aiController.naturalLanguageSearch,
);

/**
 * POST /api/ai/generate-description
 * Feature 2: Property Description Generator
 * Agents only — requires auth + agent profile
 */
router.post(
  "/generate-description",
  authenticate,
  validateRequest(generateDescriptionSchema),
  aiController.generateDescription,
);

/**
 * GET /api/ai/recommendations
 * Feature 3: AI Property Recommendations
 * Authenticated buyers — analyzes behavior and returns personalized listings
 */
router.get("/recommendations", authenticate, aiController.getRecommendations);

/**
 * POST /api/ai/neighborhood
 * Feature 4: AI Neighborhood Analyzer
 * Public — anyone can analyze a neighborhood
 */
router.post(
  "/neighborhood",
  validateRequest(neighborhoodAnalyzerSchema),
  aiController.analyzeNeighborhood,
);

/**
 * POST /api/ai/mortgage-advisor
 * Feature 5: AI Mortgage Advisor
 * Authenticated buyers — calculates payments, compares loan options, affordability insights
 */
router.post(
  "/mortgage-advisor",
  authenticate,
  validateRequest(mortgageAdvisorSchema),
  aiController.getMortgageAdvice,
);

export default router;
