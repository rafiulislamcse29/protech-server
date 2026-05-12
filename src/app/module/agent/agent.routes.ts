import { Router } from "express";
import { authenticate, authorize } from "../../middleware/index.js";
import {
  createAgentProfileSchema,
  updateAgentProfileSchema,
} from "./agent.validation.js";
import * as agentController from "./agent.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";

const router = Router();

// Public
// GET /api/agents
router.get("/", agentController.getAllAgents);

// GET /api/agents/:agentId
router.get("/:agentId", agentController.getAgentById);

// Protected — any authenticated user can create agent profile
// POST /api/agents/profile
router.post(
  "/profile",
  authenticate,
  validateRequest(createAgentProfileSchema),
  agentController.createAgentProfile,
);

// GET /api/agents/profile/me
router.get("/profile/me", authenticate, agentController.getMyAgentProfile);

// PUT /api/agents/profile/me
router.put(
  "/profile/me",
  authenticate,
  authorize("AGENT"),
  validateRequest(updateAgentProfileSchema),
  agentController.updateAgentProfile,
);

// GET /api/agents/stats
router.get(
  "/stats/me",
  authenticate,
  authorize("AGENT"),
  agentController.getAgentStats,
);

export default router;
