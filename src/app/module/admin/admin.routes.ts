import { Router } from "express";
import { authenticate, authorize } from "../../middleware/index.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import * as adminController from "./admin.controller.js";
import { approveAgentSchema, rejectAgentSchema } from "./admin.validation.js";

const router = Router();

// All admin routes require ADMIN or SUPER_ADMIN
router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

// GET  /api/admin/dashboard
router.get("/dashboard", adminController.getDashboardStats);

// Users
// GET  /api/admin/users  
router.get("/users", adminController.getAllUsers);

// GET  /api/admin/users/:userId
router.get("/users/:userId", adminController.getUserById);

// PATCH /api/admin/users/:userId/toggle-status
router.patch("/users/:userId/toggle-status", adminController.toggleUserStatus);

// DELETE /api/admin/users/:userId
router.delete("/users/:userId", adminController.deleteUser);

// Properties
// GET  /api/admin/properties
router.get("/properties", adminController.getAllProperties);

// DELETE /api/admin/properties/:propertyId
router.delete("/properties/:propertyId", adminController.deleteProperty);

// Audit Logs
// GET  /api/admin/audit-logs
router.get("/audit-logs", adminController.getAuditLogs);

// Neighborhood
// PUT  /api/admin/neighborhood
router.put("/neighborhood", adminController.upsertNeighborhood);

// Notifications
// POST /api/admin/notifications/broadcast
router.post(
  "/notifications/broadcast",
  adminController.sendBroadcastNotification,
);

// Agent Approval Management
// GET  /api/admin/agents/pending
router.get("/agents/pending", adminController.getPendingAgents);

// POST /api/admin/agents/:agentId/approve
router.post(
  "/agents/:agentId/approve",
  validateRequest(approveAgentSchema),
  adminController.approveAgent
);

// POST /api/admin/agents/:agentId/reject
router.post(
  "/agents/:agentId/reject",
  validateRequest(rejectAgentSchema),
  adminController.rejectAgent
);

export default router;
